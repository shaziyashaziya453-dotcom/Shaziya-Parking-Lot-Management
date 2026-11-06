const express = require('express');
const router = express.Router();
const db = require('../config/db');

// CREATE: Add a parking slot
router.post('/', (req, res) => {
    const { slot_number, vehicle_type, location, status } = req.body;

    const sql = `
        INSERT INTO parking_slots
        (slot_number, vehicle_type, location, status)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [slot_number, vehicle_type, location, status || 'Available'],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Parking slot added successfully',
                slot_id: result.insertId
            });
        }
    );
});

// READ: Get all parking slots
router.get('/', (req, res) => {
    db.query('SELECT * FROM parking_slots', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// READ: Get one parking slot
router.get('/:id', (req, res) => {
    db.query(
        'SELECT * FROM parking_slots WHERE slot_id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) {
                return res.status(404).json({ message: 'Slot not found' });
            }
            res.json(results[0]);
        }
    );
});

// UPDATE: Update a parking slot
router.put('/:id', (req, res) => {
    const { slot_number, vehicle_type, location, status } = req.body;

    const sql = `
        UPDATE parking_slots
        SET slot_number = ?, vehicle_type = ?, location = ?, status = ?
        WHERE slot_id = ?
    `;

    db.query(
        sql,
        [slot_number, vehicle_type, location, status, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Slot not found' });
            }
            res.json({ message: 'Parking slot updated successfully' });
        }
    );
});

// DELETE: Delete a parking slot
router.delete('/:id', (req, res) => {
    db.query(
        'DELETE FROM parking_slots WHERE slot_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Slot not found' });
            }
            res.json({ message: 'Parking slot deleted successfully' });
        }
    );
});

module.exports = router;