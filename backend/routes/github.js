const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');

const router = express.Router();

// Get user's GitHub repos
router.get('/repos', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        const response = await axios.get('https://api.github.com/user/repos', {
            headers: { Authorization: `Bearer ${user.githubToken}` },
            params: {
                sort: 'updated',
                per_page: 100
            }
        });

        const repos = response.data.map(repo => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            description: repo.description,
            cloneUrl: repo.clone_url,
            defaultBranch: repo.default_branch
        }));

        res.json(repos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Connect a repo — saves to DB; polling handles build triggers (no webhook needed)
router.post('/connect', auth, async (req, res) => {
    try {
        const { repoId, repoName, repoFullName, cloneUrl, defaultBranch } = req.body;
        const user = await User.findById(req.user.id);

        // Upsert — update existing connection or create a new one
        const project = await Project.findOneAndUpdate(
            { owner: user._id, githubRepoId: repoId },
            {
                name: repoName,
                repoFullName,
                cloneUrl,
                defaultBranch,
                status: 'connected',
                connectedAt: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ message: 'Repo connected successfully', project });

    } catch (error) {
        console.error('Error connecting repo:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get user's connected projects
router.get('/projects', auth, async (req, res) => {
    try {
        const projects = await Project.find({ owner: req.user.id })
            .sort({ createdAt: -1 })
            .select('-webhookSecret');
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Retry a failed build — resets lastCommit so the poller picks it up immediately
router.post('/projects/:id/retry', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, owner: req.user.id });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Clear lastCommit so the poller treats the current HEAD as new
        project.lastCommit = undefined;
        project.status     = 'connected';
        project.error      = undefined;
        await project.save();

        res.json({ message: 'Queued for retry — build will start within 30 seconds' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;