// services/poller.js
// Polls GitHub every 30s for new commits on connected repos.
// Replaces webhooks — no public URL / ngrok required.

const axios   = require('axios');
const Project = require('../models/Project');
const User    = require('../models/User');
const Image   = require('../models/Image');
const dockerService = require('./dockerService');

const POLL_INTERVAL = 30_000; // ms

async function pollProjects(io) {
    let projects;
    try {
        // Only poll repos that aren't currently building
        projects = await Project.find({
            repoFullName: { $exists: true, $ne: null },
            status: { $in: ['connected', 'success', 'failed'] }
        });
    } catch (err) {
        console.error('[Poller] DB error:', err.message);
        return;
    }

    for (const project of projects) {
        try {
            // Load owner's GitHub token
            const user = await User.findById(project.owner);
            if (!user?.githubToken) continue;

            const [owner, repo] = project.repoFullName.split('/');
            const branch = project.defaultBranch || 'main';

            // Fetch latest commit on the default branch
            const { data } = await axios.get(
                `https://api.github.com/repos/${owner}/${repo}/commits/${branch}`,
                { headers: { Authorization: `Bearer ${user.githubToken}` } }
            );

            const latestSha  = data.sha.substring(0, 7);
            const lastBuilt  = project.lastCommit?.sha;

            // Nothing new — skip
            if (latestSha === lastBuilt) continue;

            console.log(`[Poller] New commit on ${project.repoFullName}: ${latestSha} (was ${lastBuilt || 'none'})`);

            const projectId = project._id.toString();

            // Mark as building & record commit info
            project.status = 'building';
            project.lastCommit = {
                sha:       latestSha,
                message:   data.commit.message.split('\n')[0],
                author:    data.commit.author.name,
                timestamp: new Date(data.commit.author.date),
            };
            await project.save();

            io.to(projectId).emit('build:started', { projectId });

            // Kick off Docker build (non-blocking)
            dockerService.buildFromGitHub(
                project.cloneUrl,
                project.name,
                user.username || 'user',
                latestSha,
                io,
                projectId
            )
                .then(async (result) => {
                    project.status    = 'success';
                    project.imageName = result.imageName;
                    await project.save();

                    // Write / update the Image record so it shows up on the Pull page
                    await Image.findOneAndUpdate(
                        { projectId: project._id },
                        {
                            name:        project.name,
                            description: `Built from ${project.repoFullName} @ ${latestSha}`,
                            source:      'github',
                            dockerImage: result.imageName,
                            projectId:   project._id,
                            user:        project.owner,
                            size:        'Docker image',
                            buildStatus: 'success',
                            buildError:  null,
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );

                    io.to(projectId).emit('build:complete', { projectId });
                })
                .catch(async (error) => {
                    project.status = 'failed';
                    project.error  = error.message;
                    await project.save();

                    // Update Image record to failed state if one exists
                    await Image.findOneAndUpdate(
                        { projectId: project._id },
                        { buildStatus: 'failed', buildError: error.message }
                    );

                    io.to(projectId).emit('build:failed', { projectId, error: error.message });
                });

        } catch (err) {
            // Per-project errors: expired token, deleted repo, rate limit, etc.
            console.error(`[Poller] Skipping ${project.repoFullName}: ${err.message}`);
        }
    }
}

function startPoller(io) {
    console.log('[Poller] Started — checking for new commits every 30s');
    pollProjects(io);                              // run once immediately
    setInterval(() => pollProjects(io), POLL_INTERVAL);
}

module.exports = { startPoller };
