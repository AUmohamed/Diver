const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Image = require('./models/Image');

dotenv.config();

const users = [
    {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
    },
    {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
    },
];

const images = [
    {
        name: 'mern-blog-app',
        description: 'A full-stack blog application with React, Node.js, and MongoDB',
        size: '24.5 MB',
        filename: 'seed-mern-blog.zip',
        originalName: 'mern-blog-app.zip',
    },
    {
        name: 'ecommerce-store',
        description: 'E-commerce platform built with the MERN stack',
        size: '45.2 MB',
        filename: 'seed-ecommerce.zip',
        originalName: 'ecommerce-store.zip',
    },
    {
        name: 'chat-app',
        description: 'Real-time chat application with Socket.io',
        size: '12.8 MB',
        filename: 'seed-chat-app.zip',
        originalName: 'chat-app.zip',
    },
    {
        name: 'task-manager',
        description: 'Project management tool with drag-and-drop Kanban board',
        size: '18.1 MB',
        filename: 'seed-task-manager.zip',
        originalName: 'task-manager.zip',
    },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');

        // Clear existing data
        await User.deleteMany({});
        await Image.deleteMany({});
        console.log('Cleared existing data');

        // Create users
        const createdUsers = await User.create(users);
        console.log(`Created ${createdUsers.length} users`);

        // Assign images to the first user
        const userImages = images.map((img) => ({
            ...img,
            user: createdUsers[0]._id,
        }));

        const createdImages = await Image.create(userImages);
        console.log(`Created ${createdImages.length} images`);

        console.log('\n--- Seed Complete ---');
        console.log('Login credentials:');
        console.log('  Email: john@example.com');
        console.log('  Password: password123');
        console.log('  Email: jane@example.com');
        console.log('  Password: password123');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seed();
