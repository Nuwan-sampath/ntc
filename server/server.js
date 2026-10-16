const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Database Schemas & Models ---

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' } // 'customer' or 'admin'
});
const User = mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userEmail: String,
  name: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  items: Array,
  subtotal: Number,
  shipping: Number,
  total: Number,
  status: { type: String, default: 'Pending' }, // Pending, Dispatched, Delivered
  date: { type: String, default: () => new Date().toLocaleDateString() }
});
const Order = mongoose.model('Order', orderSchema);

// --- API Routes ---

// 1. Initialize Default Admin Account
app.post('/api/init-admin', async (req, res) => {
  try {
    const adminEmail = 'admin@naturalcocos.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Store Admin',
        email: adminEmail,
        password: 'adminpassword123',
        role: 'admin'
      });
      console.log('Default admin account created.');
    }
    res.status(200).json({ message: 'Admin initialized' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. User Sign Up
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const newUser = await User.create({ name, email, password, role: 'customer' });
    res.status(201).json({ name: newUser.name, email: newUser.email, role: newUser.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. User Sign In
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    res.status(200).json({ name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get All Orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ _id: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Place a New Order
app.post('/api/orders', async (req, res) => {
  try {
    const count = await Order.countDocuments();
    const orderId = `NC-${1001 + count}`;
    const newOrder = await Order.create({ ...req.body, id: orderId });
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Update Order Status (Admin Action)
app.patch('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});