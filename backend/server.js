// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');

// // Load environment variables
// dotenv.config();

// // Connect to MongoDB
// connectDB();

// const app = express();

// // Middleware
// app.use(cors({
//     origin: 'http://localhost:3000',
//     credentials: true,
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/images', require('./routes/images'));

// // Health check
// app.get('/health', (req, res) => {
//     res.json({ status: 'ok' });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ message: err.message || 'Server error' });
// });

// const PORT = process.env.PORT || 8000;

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

// const githubRoutes = require('./routes/Github.js');
// const webhookRoutes = require('./routes/webhook.js');

// app.use('/api/github', githubRoutes);
// app.use('/api/webhook', webhookRoutes);

// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const connectDB = require('./config/db');

// // Expose the server via ngrok
// (async () => {
//     const listener = await ngrok.forward({
//         addr: 8080,
//         authtoken_from_env: true,
//     });
//     console.log(`🌐 Public URL: ${listener.url()}`);
// })();

// // Load environment variables
// dotenv.config();

// // Connect to MongoDB
// connectDB();

// const app = express();

// // Middleware
// app.use(cors({
//     origin: 'http://localhost:3000',
//     credentials: true,
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes - ALL ROUTES GO HERE, BEFORE app.listen()
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/github', require('./routes/Github.js'));
// app.use('/api/webhook', require('./routes/webhook.js'));
// app.use('/images', require('./routes/images'));

// // Health check
// app.get('/health', (req, res) => {
//     res.json({ status: 'ok' });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ message: err.message || 'Server error' });
// });

// const PORT = process.env.PORT || 8000;

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        credentials: true
    }
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
// Capture raw body before JSON parsing (needed for webhook signature verification)
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/github', require('./routes/Github.js'));
app.use('/api/webhook', require('./routes/webhook.js'));
app.use('/images', require('./routes/images'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Start commit poller (replaces GitHub webhooks — no public URL needed)
const { startPoller } = require('./services/poller');
startPoller(io);

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (projectId) => {
        socket.join(projectId);
        console.log(`Socket ${socket.id} joined room ${projectId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});