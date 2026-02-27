const express  = require('express');
const axios     = require('axios');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const crypto    = require('crypto');
const nodemailer = require('nodemailer');
const User      = require('../models/User');

const router = express.Router();

// ─── helpers ────────────────────────────────────────────────────────────────

function makeToken(userId, username) {
    return jwt.sign({ id: userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function getMailer() {
    // Use real SMTP if configured, otherwise fall back to Ethereal (test inbox)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host:   process.env.SMTP_HOST,
            port:   Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    }
    // Auto-create a free Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host:   'smtp.ethereal.email',
        port:   587,
        auth:   { user: testAccount.user, pass: testAccount.pass },
    });
}

// ─── Email / Password ────────────────────────────────────────────────────────

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Store plain password — the pre-save hook in User.js will hash it
        const user = new User({ username, email, password });
        await user.save();

        const token = makeToken(user._id, user.username);
        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = makeToken(user._id, user.username);
        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── Forgot / Reset Password ─────────────────────────────────────────────────

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });

        // Always respond with success to prevent email enumeration
        if (!user || !user.password) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate a secure random token (valid for 1 hour)
        const rawToken    = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Use updateOne to bypass schema validation (some old users may be missing required fields)
        await User.updateOne(
            { _id: user._id },
            { resetToken: hashedToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) }
        );

        const resetUrl = `http://localhost:3000/reset-password?token=${rawToken}`;

        console.log('\n──────────────────────────────────────────────');
        console.log('🔑  Password reset link (dev):');
        console.log(`    ${resetUrl}`);
        console.log('──────────────────────────────────────────────\n');

        // In development (no real SMTP), return the link in the response so the
        // frontend can display it directly — no email config needed.
        const isDevMode = !process.env.SMTP_HOST;
        if (isDevMode) {
            return res.json({
                message: 'Reset link generated.',
                devResetUrl: resetUrl,
            });
        }

        // Send email (only when SMTP is configured)
        try {
            const mailer = await getMailer();
            const info = await mailer.sendMail({
                from:    process.env.SMTP_FROM || '"Diver" <no-reply@diver.app>',
                to:      user.email,
                subject: 'Reset your Diver password',
                html: `
                    <div style="font-family:sans-serif;max-width:480px;margin:auto">
                        <h2 style="color:#10162F">Reset your password</h2>
                        <p>We received a request to reset the password for your Diver account.</p>
                        <p>Click the button below. The link expires in <strong>1 hour</strong>.</p>
                        <a href="${resetUrl}"
                           style="display:inline-block;margin:20px 0;padding:12px 24px;
                                  background:#5B4FE9;color:#fff;font-weight:700;
                                  text-decoration:none;border:2px solid #10162F">
                            Reset Password
                        </a>
                        <p style="color:#666;font-size:13px">
                            If you didn't request this, you can safely ignore this email.
                        </p>
                    </div>
                `,
            });

            // Log Ethereal preview URL when using the test mailer
            const preview = nodemailer.getTestMessageUrl(info);
            if (preview) {
                console.log('📬  Email preview (Ethereal):', preview);
                console.log('    Open the link above to see the email in your browser.\n');
            }
        } catch (mailErr) {
            console.error('Mail send failed (link still logged above):', mailErr.message);
        }

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('Forgot-password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetToken:       hashedToken,
            resetTokenExpiry: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Reset link is invalid or has expired.' });
        }

        // Hash the new password manually then save via updateOne (bypasses schema validation)
        const hashed = await bcrypt.hash(password, 12);
        await User.updateOne(
            { _id: user._id },
            { password: hashed, $unset: { resetToken: '', resetTokenExpiry: '' } }
        );

        res.json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('Reset-password error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────

router.get('/github', (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,user:email`;
    res.redirect(url);
});

router.get('/github/new', (req, res) => {
    const path = encodeURIComponent(
        `/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo%2Cuser%3Aemail`
    );
    res.redirect(`https://github.com/login?return_to=${path}`);
});

router.get('/github/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokenRes = await axios.post(
            'https://github.com/login/oauth/access_token',
            { client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code },
            { headers: { Accept: 'application/json' } }
        );
        const accessToken = tokenRes.data.access_token;

        const userRes   = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const ghUser = userRes.data;

        let user = await User.findOne({ githubId: ghUser.id });
        if (!user) {
            user = new User({
                username:    ghUser.login,
                email:       ghUser.email,
                githubId:    ghUser.id,
                githubToken: accessToken,
                avatar:      ghUser.avatar_url,
            });
            await user.save();
        } else {
            user.githubToken = accessToken;
            await user.save();
        }

        const token = makeToken(user._id, user.username);
        res.redirect(`http://localhost:3000/auth/callback?token=${token}`);
    } catch (err) {
        console.error('GitHub OAuth error:', err);
        res.redirect('http://localhost:3000/login?error=auth_failed');
    }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user    = await User.findById(decoded.id).select('-password -githubToken -resetToken -resetTokenExpiry');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
