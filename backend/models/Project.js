// backend/models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    // Basic info
    name: { type: String, required: true },
    description: { type: String },

    // GitHub connection info
    repoFullName: { type: String }, // e.g., "username/my-repo"
    cloneUrl: { type: String }, // Git clone URL
    defaultBranch: { type: String, default: 'main' },
    githubRepoId: { type: Number }, // GitHub's repo ID
    webhookSecret: { type: String }, // For verifying webhooks

    // Build info
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageName: { type: String }, // Docker image name after build
    status: {
        type: String,
        enum: ['connected', 'building', 'success', 'failed'],
        default: 'connected'
    },

    // Last commit info (from webhook)
    lastCommit: {
        sha: { type: String },
        message: { type: String },
        author: { type: String },
        timestamp: { type: Date }
    },

    error: { type: String },
    connectedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);