const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Sale = require('./models/Sale');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');
        const sales = await Sale.find({});
        console.log(`Found ${sales.length} sales.`);
        sales.forEach(s => {
            console.log(`ID: ${s._id}, Date: ${s.date} (Type: ${typeof s.date}), Total: ${s.total}`);
        });
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
