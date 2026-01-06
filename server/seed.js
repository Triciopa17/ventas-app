require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        seedData();
    })
    .catch(err => console.error(err));

async function seedData() {
    try {
        // Check if data already exists
        const productCount = await Product.countDocuments();
        const userCount = await User.countDocuments();

        if (productCount > 0 || userCount > 0) {
            console.log('Database already has data. Skipping seed to prevent data loss.');
            process.exit();
            return;
        }

        // Only seed if empty
        console.log('Seeding initial data...');

        // Create Default User
        const hashedPassword = await bcrypt.hash('123456', 10);
        await User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'admin'
        });

        // Create Products
        await Product.insertMany([
            { name: 'Laptop', price: 1200, description: 'High performance laptop', stock: 10, minStock: 5 },
            { name: 'Mouse', price: 25, description: 'Wireless mouse', stock: 50, minStock: 5 },
            { name: 'Keyboard', price: 45, description: 'Mechanical keyboard', stock: 30, minStock: 5 },
            { name: 'Monitor', price: 300, description: '4K standard monitor', stock: 15, minStock: 5 }
        ]);

        console.log('Data seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}
