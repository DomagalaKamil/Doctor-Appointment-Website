const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // JWT for authentication

const app = express();
const port = 3000;

// Replace with your own secret key
const JWT_SECRET = 'your_jwt_secret_key';

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'admin',
    password: '1234',
    database: 'doctor_appointments'
}).promise();

app.use(cors());
app.use(bodyParser.json());

// Registration endpoint
app.post('/register', async (req, res) => {
    const { username, password, role, name, surname, dob, address, gender, license, specialist } = req.body;
    
    try {
        const [userResult] = await pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, role]);
        const userId = userResult.insertId;

        if (role === 'patient') {
            await pool.query('INSERT INTO patients (user_id, name, surname, dob, address, gender) VALUES (?, ?, ?, ?, ?, ?)', 
                [userId, name, surname, dob, address, gender]);
        } else if (role === 'doctor') {
            await pool.query('INSERT INTO doctors (user_id, name, surname, license_code, specialist, clinic_address) VALUES (?, ?, ?, ?, ?, ?)', 
                [userId, name, surname, license, specialist, address]);
        }

        res.status(201).json({ message: 'Registration successful!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        
        if (rows.length > 0) {
            const user = rows[0];
            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
