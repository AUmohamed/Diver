const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username:         { type: String, required: true, unique: true },
    email:            { type: String },
    password:         { type: String },                               // null for GitHub-only users
    githubId:         { type: String, unique: true, sparse: true },
    githubToken:      { type: String },
    avatar:           { type: String },
    resetToken:       { type: String },
    resetTokenExpiry: { type: Date },
    createdAt:        { type: Date, default: Date.now },
});

// Hash password before saving (only when password field is modified and not already hashed)
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    // Avoid double-hashing: bcrypt hashes start with '$2'
    if (this.password.startsWith('$2')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare a plain-text candidate against the stored hash
userSchema.methods.comparePassword = async function (candidate) {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
