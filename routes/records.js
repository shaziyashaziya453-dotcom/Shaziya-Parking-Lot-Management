const express = require('express');
const router = express.Router();
const db = require('../config/db');

// CREATE: Vehicle parking entry
router.post('/', (req, res) => {
    const { vehicle_id, slot_id } = req.body;

    db.query(
        'SELECT status FROM parking_slots WHERE slot_id = ?',
        [slot_id],
        (err, slots) => {
            if (err) return res.status(500).json({ error: err.message });

            if (slots.length === 0) {
                return res.status(404).json({ message: 'Parking slot not found' });
            }

            if (slots[0].status !== 'Available') {
                return res.status(400).json({ message: 'Slot is already occupied' });
            }

            db.query(
                `INSERT INTO parking_records
                (vehicle_id, slot_id, entry_time, parking_fee, status)
                VALUES (?, ?, NOW(), 0, 'Parked')`,
                [vehicle_id, slot_id],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });

                    db.query(
                        "UPDATE parking_slots SET status = 'Occupied' WHERE slot_id = ?",
                        [slot_id],
                        (err) => {
                            if (err) return res.status(500).json({ error: err.message });

                            res.status(201).json({
                                message: 'Vehicle entry recorded successfully',
                                record_id: result.insertId
                            });
                        }
                    );
                }
            );
        }
    );
});

// READ: Get all parking records
router.get('/', (req, res) => {
    const sql = `
        SELECT pr.*, v.vehicle_number, ps.slot_number
        FROM parking_records pr
        JOIN vehicles v ON pr.vehicle_id = v.vehicle_id
        JOIN parking_slots ps ON pr.slot_id = ps.slot_id
        ORDER BY pr.record_id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// READ: Get one parking record
router.get('/:id', (req, res) => {
    db.query(
        'SELECT * FROM parking_records WHERE record_id = ?',
        [req.params.id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err.message });

            if (results.length === 0) {
                return res.status(404).json({ message: 'Record not found' });
            }

            res.json(results[0]);
        }
    );
});

// UPDATE: Vehicle exit and fee calculation
router.post('/:id/exit', (req, res) => {
    db.query(
        'SELECT * FROM parking_records WHERE record_id = ?',
        [req.params.id],
        (err, records) => {
            if (err) return res.status(500).json({ error: err.message });

            if (records.length === 0) {
                return res.status(404).json({ message: 'Record not found' });
            }

            const record = records[0];

            if (record.status !== 'Parked') {
                return res.status(400).json({ message: 'Vehicle has already exited' });
            }

            const entry = new Date(record.entry_time);
            const exit = new Date();

            const hours = Math.max(
                1,
                Math.ceil((exit - entry) / (1000 * 60 * 60))
            );

            const fee = hours * 20;

            db.query(
                `UPDATE parking_records
                SET exit_time = NOW(), parking_fee = ?, status = 'Completed'
                WHERE record_id = ?`,
                [fee, req.params.id],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });

                    db.query(
                        "UPDATE parking_slots SET status = 'Available' WHERE slot_id = ?",
                        [record.slot_id],
                        (err) => {
                            if (err) return res.status(500).json({ error: err.message });

                            res.json({
                                message: 'Vehicle exit recorded successfully',
                                parking_hours: hours,
                                parking_fee: fee
                            });
                        }
                    );
                }
            );
        }
    );
});

// UPDATE: Edit a parking record
router.put('/:id', (req, res) => {
    const { vehicle_id, slot_id, entry_time, exit_time, parking_fee, status } = req.body;

    const sql = `
        UPDATE parking_records
        SET vehicle_id = ?, slot_id = ?, entry_time = ?,
            exit_time = ?, parking_fee = ?, status = ?
        WHERE record_id = ?
    `;

    db.query(
        sql,
        [vehicle_id, slot_id, entry_time, exit_time, parking_fee, status, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Record not found' });
            }

            res.json({ message: 'Parking record updated successfully' });
        }
    );
});

// DELETE: Delete a parking record
router.delete('/:id', (req, res) => {
    db.query(
        'SELECT * FROM parking_records WHERE record_id = ?',
        [req.params.id],
        (err, records) => {
            if (err) return res.status(500).json({ error: err.message });

            if (records.length === 0) {
                return res.status(404).json({ message: 'Record not found' });
            }

            const record = records[0];

            db.query(
                'DELETE FROM parking_records WHERE record_id = ?',
                [req.params.id],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });

                    if (record.status === 'Parked') {
                        db.query(
                            "UPDATE parking_slots SET status = 'Available' WHERE slot_id = ?",
                            [record.slot_id],
                            (err) => {
                                if (err) return res.status(500).json({ error: err.message });
                                res.json({ message: 'Parking record deleted successfully' });
                            }
                        );
                    } else {
                        res.json({ message: 'Parking record deleted successfully' });
                    }
                }
            );
        }
    );
});

module.exports = router;