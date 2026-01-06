const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// GET /api/sales - History
router.get('/sales', async (req, res) => {
    try {
        let query = {};

        // Date filtering
        if (req.query.start && req.query.end) {
            query.date = {
                $gte: new Date(req.query.start),
                $lte: new Date(req.query.end)
            };
        }

        const sales = await Sale.find(query).sort({ date: -1 });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create Sale (POS)
router.post('/sales', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { items, paymentMethod, total } = req.body;

        // Verify stock and deduct
        for (const item of items) {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
                throw new Error(`Product ${item.productName} not found`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }
            product.stock -= item.quantity;
            await product.save({ session });
        }

        const sale = new Sale({
            items,
            paymentMethod,
            total
        });

        await sale.save({ session });
        await session.commitTransaction();
        res.status(201).json(sale);

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

const mongoose = require('mongoose');
module.exports = router;
