
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// CREATE USER
router.post('/', (req, res) => {
    const { name, phone, email, role } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    const sql = `INSERT INTO users (name, phone, email, role)
                 VALUES (?, ?, ?, ?)`;

    db.query(sql, [name, phone, email, role], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            message: 'User added successfully!',
            user_id: result.insertId
        });
    });
});

// READ ALL USERS
router.get('/', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// READ SINGLE USER
router.get('/:id', (req, res) => {
    db.query(
        'SELECT * FROM users WHERE user_id = ?',
        [req.params.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(results[0]);
        }
    );
});

// UPDATE USER
router.put('/:id', (req, res) => {
    const { name, phone, email, role } = req.body;

    const sql = `UPDATE users
                 SET name = ?, phone = ?, email = ?, role = ?
                 WHERE user_id = ?`;

    db.query(sql, [name, phone, email, role, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'User updated successfully!' });
        }
    );
});

// DELETE USER
router.delete('/:id', (req, res) => {
    db.query(
        'DELETE FROM users WHERE user_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: 'Could not delete user. Check dependent records.',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({ message: 'User deleted successfully!' });
        }
    );
});

module.exports = router;
