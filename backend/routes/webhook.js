const express = require('express');
const crypto = require('crypto');
const Project = require('../models/Project');
const dockerService = require('../services/dockerService');

const router = express.Router();

// Verify GitHub webhook signature using the raw body
function verifySignature(req, secret) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    const body = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const hmac   = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(body).digest('hex');

    try {
        const a = Buffer.from(signature);
        const b = Buffer.from(digest);
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

// GitHub webhook endpoint
router.post('/github', async (req, res) => {
    try {
        const event = req.headers['x-github-event'];

        // We only care about push events
        if (event !== 'push') {
            return res.status(200).send('Event ignored');
        }

        const { repository, ref, pusher, head_commit } = req.body;

        // Find the project by repo ID
        const project = await Project.findOne({ githubRepoId: repository.id });

        if (!project) {
            return res.status(404).send('Project not found');
        }

        // Verify webhook signature (SECURITY - DO NOT SKIP)
        if (!verifySignature(req, project.webhookSecret)) {
            console.error('Invalid webhook signature');
            return res.status(401).send('Invalid signature');
        }

        console.log(`Push received for ${repository.full_name} by ${pusher.name}`);

        // Get socket.io instance
        const io = req.app.get('io');
        const projectId = project._id.toString();

        // Update project status
        project.status = 'building';
        project.lastCommit = {
            sha: head_commit.id.substring(0, 7),
            message: head_commit.message,
            author: head_commit.author.name,
            timestamp: head_commit.timestamp
        };
        await project.save();

        // Notify frontend that build started
        io.to(projectId).emit('build:started', { projectId });

        // Start build in background
        dockerService.buildFromGitHub(
            project.cloneUrl,
            project.name,
            project.owner.username || 'user',
            head_commit.id.substring(0, 7),
            io,
            projectId
        )
            .then(async (result) => {
                project.status = 'success';
                project.imageName = result.imageName;
                await project.save();
                io.to(projectId).emit('build:complete', { projectId });
            })
            .catch(async (error) => {
                project.status = 'failed';
                project.error = error.message;
                await project.save();
                io.to(projectId).emit('build:failed', { projectId, error: error.message });
            });

        res.status(200).send('Build started');

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;