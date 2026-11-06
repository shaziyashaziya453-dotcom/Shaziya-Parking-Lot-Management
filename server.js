
const express = require('express');
const cors = require('cors');

const db = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Test API
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Welcome to Shaziya Parking Lot Management System!'
    });
});

// User CRUD Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/records', require('./routes/records'));
// Start Server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
