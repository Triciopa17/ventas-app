const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: String, // Snapshot of name at time of sale
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});

const saleSchema = new mongoose.Schema({
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card'],
        required: true
    },
    items: [saleItemSchema],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Sale', saleSchema);
