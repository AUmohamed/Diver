// backend/services/dockerService.js
const Docker = require('dockerode');
const simpleGit = require('simple-git');
const fs = require('fs');
const path = require('path');

const docker = new Docker();

class DockerService {

    async buildFromGitHub(repoUrl, projectName, username, commitSha, io, projectId) {
        const buildDir = path.join(__dirname, '../builds', projectId);

        try {
            // 1. Clone repo
            io.to(projectId).emit('build:log', { log:`🔄 Cloning ${repoUrl}...\n` });

            await fs.promises.mkdir(buildDir, { recursive: true });
            const git = simpleGit();
            await git.clone(repoUrl, buildDir);

            io.to(projectId).emit('build:log', { log:'✅ Repository cloned\n' });

            // 2. Check for Dockerfile
            const dockerfilePath = path.join(buildDir, 'Dockerfile');
            if (!fs.existsSync(dockerfilePath)) {
                io.to(projectId).emit('build:log', { log:'⚠️  No Dockerfile found\n' });
                throw new Error('No Dockerfile in repository');
            }

            // 3. Build image — Docker requires all-lowercase names
            const safeUser    = username.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
            const safeProject = projectName.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
            const imageName = `localhost:5000/${safeUser}/${safeProject}:${commitSha}`;
            const latestTag = `localhost:5000/${safeUser}/${safeProject}:latest`;

            io.to(projectId).emit('build:log', { log:`🔨 Building ${imageName}...\n\n` });

            const stream = await docker.buildImage({
                context: buildDir,
                src: fs.readdirSync(buildDir)
            }, { t: [imageName, latestTag] });

            // 4. Stream build logs
            await new Promise((resolve, reject) => {
                docker.modem.followProgress(stream,
                    (err, res) => err ? reject(err) : resolve(res),
                    (event) => {
                        if (event.stream) {
                            io.to(projectId).emit('build:log', { log: event.stream });
                        }
                    }
                );
            });

            io.to(projectId).emit('build:log', { log:'\n✅ Build successful!\n' });

            // 5. Cleanup
            await fs.promises.rm(buildDir, { recursive: true, force: true });

            return { success: true, imageName: latestTag };

        } catch (error) {
            io.to(projectId).emit('build:log', { log:`\n❌ Build failed: ${error.message}\n` });

            if (fs.existsSync(buildDir)) {
                await fs.promises.rm(buildDir, { recursive: true, force: true });
            }

            throw error;
        }
    }

    async runContainer(imageName, projectId, io) {
        try {
            io.to(projectId).emit('container:log', { log:'🚀 Starting container...\n' });

            const container = await docker.createContainer({
                Image: imageName,
                ExposedPorts: { '3000/tcp': {} },
                HostConfig: {
                    PortBindings: { '3000/tcp': [{ HostPort: '0' }] },
                    Memory: 512 * 1024 * 1024,
                    NanoCpus: 500000000
                }
            });

            await container.start();

            const logStream = await container.logs({
                follow: true,
                stdout: true,
                stderr: true
            });

            logStream.on('data', (chunk) => {
                io.to(projectId).emit('container:log', { log:chunk.toString() });
            });

            const info = await container.inspect();
            const port = info.NetworkSettings.Ports['3000/tcp'][0].HostPort;

            io.to(projectId).emit('container:log', { log:`\n✅ Running at http://localhost:${port}\n` });

            return { containerId: container.id, port };

        } catch (error) {
            io.to(projectId).emit('container:log', { log:`\n❌ Error: ${error.message}\n` });
            throw error;
        }
    }

    // Build a Docker image from an uploaded ZIP archive
    async buildFromUpload(zipPath, projectName, username, imageId) {
        const AdmZip  = require('adm-zip');
        const buildDir = path.join(__dirname, '../builds', 'upload-' + imageId);

        try {
            await fs.promises.mkdir(buildDir, { recursive: true });

            // Extract ZIP
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(buildDir, /* overwrite */ true);

            // Find Dockerfile — check root first, then one level deep
            let contextDir = buildDir;
            if (!fs.existsSync(path.join(buildDir, 'Dockerfile'))) {
                const entries = fs.readdirSync(buildDir);
                let found = false;
                for (const entry of entries) {
                    const sub = path.join(buildDir, entry);
                    if (fs.statSync(sub).isDirectory() && fs.existsSync(path.join(sub, 'Dockerfile'))) {
                        contextDir = sub;
                        found = true;
                        break;
                    }
                }
                if (!found) throw new Error('No Dockerfile found in the uploaded archive');
            }

            // Build Docker image
            const safeUser    = username.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
            const safeProject = projectName.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
            const imageName   = `diver/${safeUser}/${safeProject}:latest`;

            const stream = await docker.buildImage(
                { context: contextDir, src: fs.readdirSync(contextDir) },
                { t: imageName }
            );

            await new Promise((resolve, reject) => {
                docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
            });

            await fs.promises.rm(buildDir, { recursive: true, force: true });
            return { success: true, imageName };

        } catch (error) {
            if (fs.existsSync(buildDir))
                await fs.promises.rm(buildDir, { recursive: true, force: true });
            throw error;
        }
    }

    async stopContainer(containerId) {
        const container = docker.getContainer(containerId);
        await container.stop();
        await container.remove();
    }
}

module.exports = new DockerService();