const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all employees
router.get("/", (req, res) => {
    db.query("SELECT * FROM employees", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// Get active employees
router.get("/active", (req, res) => {
    db.query(
        "SELECT * FROM employees WHERE deleted IS NULL",
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
});

// Get deleted employees
router.get("/deleted", (req, res) => {
    db.query(
        "SELECT * FROM employees WHERE deleted IS NOT NULL",
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
});

// Add employee
router.post("/", (req, res) => {
    const { name, age, city, email } = req.body;

    db.query(
        "INSERT INTO employees (name, age, city, email) VALUES (?, ?, ?, ?)",
        [name, age, city, email],
        (err, result) => {
            if (err) return res.status(500).json(err);

            res.status(201).json({
                message: "Employee added successfully",
                id: result.insertId
            });
        }
    );
});

// Soft delete employee
router.delete("/:id", (req, res) => {
    db.query(
        "UPDATE employees SET deleted = NOW() WHERE id = ? AND deleted IS NULL",
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json(err);

            if (!result.affectedRows) {
                return res.status(404).json({ message: "Active employee not found" });
            }

            res.json({ message: "Employee deleted successfully" });
        }
    );
});

// Restore employee
router.put("/restore/:id", (req, res) => {
    db.query(
        "UPDATE employees SET deleted = NULL WHERE id = ? AND deleted IS NOT NULL",
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json(err);

            if (!result.affectedRows) {
                return res.status(404).json({ message: "Deleted employee not found" });
            }

            res.json({ message: "Employee restored successfully" });
        }
    );
});

module.exports = router;
