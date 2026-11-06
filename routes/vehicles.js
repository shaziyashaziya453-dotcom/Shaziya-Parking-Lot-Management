
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// CREATE VEHICLE
router.post('/', (req, res) => {
    const { user_id, vehicle_number, vehicle_type, vehicle_model } = req.body;

    if (!user_id || !vehicle_number || !vehicle_type) {
        return res.status(400).json({
            message: 'User ID, vehicle number and type are required'
        });
    }

    const sql = `INSERT INTO vehicles
        (user_id, vehicle_number, vehicle_type, vehicle_model)
        VALUES (?, ?, ?, ?)`;

    db.query(sql,
        [user_id, vehicle_number, vehicle_type, vehicle_model],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                message: 'Vehicle registered successfully!',
                vehicle_id: result.insertId
            });
        }
    );
});

// READ ALL VEHICLES
router.get('/', (req, res) => {
    const sql = `
        SELECT vehicles.*, users.name AS owner_name
        FROM vehicles
        JOIN users ON vehicles.user_id = users.user_id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// READ SINGLE VEHICLE
router.get('/:id', (req, res) => {
    db.query(
        'SELECT * FROM vehicles WHERE vehicle_id = ?',
        [req.params.id],
        (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: 'Vehicle not found'
                });
            }

            res.json(results[0]);
        }
    );
});

// UPDATE VEHICLE
router.put('/:id', (req, res) => {
    const { user_id, vehicle_number, vehicle_type, vehicle_model } = req.body;

    const sql = `UPDATE vehicles
        SET user_id = ?, vehicle_number = ?,
        vehicle_type = ?, vehicle_model = ?
        WHERE vehicle_id = ?`;

    db.query(sql,
        [user_id, vehicle_number, vehicle_type, vehicle_model, req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'Vehicle not found'
                });
            }

            res.json({ message: 'Vehicle updated successfully!' });
        }
    );
});

// DELETE VEHICLE
router.delete('/:id', (req, res) => {
    db.query(
        'DELETE FROM vehicles WHERE vehicle_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    message: 'Cannot delete vehicle. It may have parking records.',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: 'Vehicle not found'
                });
            }

            res.json({ message: 'Vehicle deleted successfully!' });
        }
    );
});

module.exports = router;
