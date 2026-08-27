require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const storyRoutes = require('./routes/stories');
const commentRoutes = require('./routes/comments');
const bookRoutes = require('./routes/books');
const stationeryRoutes = require('./routes/stationery');
const blogRoutes = require('./routes/blog');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/stationery', stationeryRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Taura Africa backend running on port ${PORT}`));
