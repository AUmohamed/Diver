const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        size: { type: String, default: 'N/A' },

        // Where this entry came from
        source: { type: String, enum: ['upload', 'github'], default: 'upload' },

        // upload-specific (raw file stored on disk)
        filename:     { type: String },   // multer-saved filename
        originalName: { type: String },   // user's original filename

        // docker-specific (built image)
        dockerImage: { type: String },    // e.g. "diver/user/myapp:latest"
        projectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // for github builds

        // build lifecycle
        buildStatus: {
            type: String,
            enum: ['pending', 'building', 'success', 'failed'],
            default: 'success',
        },
        buildError: { type: String },

        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
