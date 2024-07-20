const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;
const secretKey = 'your_secret_key';

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'doctor_appointments'
});

db.connect(err => {
    if (err) throw err;
    console.log('Connected to database');
});

app.use(cors());
app.use(bodyParser.json());

app.post('/register', (req, res) => {
    const { username, password, role, name, surname, dob, address, gender, license, specialist, availability } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'User registration failed' });
        }

        const userId = result.insertId;

        if (role === 'patient') {
            db.query('INSERT INTO patients (user_id, name, surname, dob, address, gender) VALUES (?, ?, ?, ?, ?, ?)', [userId, name, surname, dob, address, gender], err => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Patient registration failed' });
                }
                res.json({ message: 'Patient registered successfully' });
            });
        } else if (role === 'doctor') {
            db.query('INSERT INTO doctors (user_id, name, surname, license_code, specialist, clinic_address) VALUES (?, ?, ?, ?, ?, ?)', [userId, name, surname, license, specialist, address], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Doctor registration failed' });
                }

                const doctorId = result.insertId;

                const availabilityEntries = availability.map(entry => [doctorId, entry.day_of_week, entry.start_time, entry.end_time]);

                db.query('INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES ?', [availabilityEntries], err => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Doctor availability registration failed' });
                    }
                    res.json({ message: 'Doctor registered successfully' });
                });
            });
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: 'Login failed' });
        }
        if (results.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const user = results[0];

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, secretKey);
        res.json({ token, role: user.role, userId: user.id });
    });
});

app.get('/specialists', (req, res) => {
    db.query('SELECT DISTINCT specialist FROM doctors', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to fetch specialists' });
        }
        res.json(results);
    });
});

app.get('/doctors', (req, res) => {
    const specialist = req.query.specialist;
    let query = 'SELECT id, name, surname FROM doctors';
    let params = [];

    if (specialist) {
        query += ' WHERE specialist = ?';
        params.push(specialist);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to fetch doctors' });
        }
        res.json(results);
    });
});

app.get('/doctor-availability', (req, res) => {
    const doctorId = req.query.doctorId;

    db.query('SELECT day_of_week, start_time, end_time FROM doctor_availability WHERE doctor_id = ?', [doctorId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to fetch doctor availability' });
        }
        res.json(results);
    });
});

app.post('/appointments', (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];
    let decoded;

    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { doctorId, date, time, problemDescription } = req.body;
    const userId = decoded.userId;

    const bookingDateTime = new Date(`${date}T${time}`);
    const currentDateTime = new Date();

    // Check if the booking date and time is in the future
    if (bookingDateTime <= currentDateTime) {
        return res.status(400).json({ message: 'Cannot book an appointment in the past' });
    }

    db.query('SELECT id FROM patients WHERE user_id = ?', [userId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Failed to identify patient:', err);
            return res.status(500).json({ message: 'Failed to identify patient' });
        }

        const patientId = results[0].id;

        db.query('SELECT * FROM appointments WHERE doctor_id = ? AND date = ? AND time = ?', [doctorId, date, time], (err, results) => {
            if (err) {
                console.error('Failed to check appointment availability:', err);
                return res.status(500).json({ message: 'Failed to check appointment availability' });
            }

            if (results.length > 0) {
                return res.status(400).json({ message: 'Time slot already booked' });
            }

            // Adjust the date to store it correctly in the database
            const adjustedDate = new Date(date);
            adjustedDate.setDate(adjustedDate.getDate() + 1);
            const formattedDate = adjustedDate.toISOString().split('T')[0];

            db.query('INSERT INTO appointments (patient_id, doctor_id, date, time, problem_description) VALUES (?, ?, ?, ?, ?)', [patientId, doctorId, formattedDate, time, problemDescription], (err, results) => {
                if (err) {
                    console.error('Failed to book appointment:', err);
                    return res.status(500).json({ message: 'Failed to book appointment' });
                }
                res.status(200).json({ message: 'Appointment booked successfully' });
            });
        });
    });
});




app.get('/appointments', (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];
    let decoded;

    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const doctorId = req.query.doctorId;

    db.query('SELECT date, time FROM appointments WHERE doctor_id = ?', [doctorId], (err, results) => {
        if (err) {
            console.error('Failed to fetch appointments for doctor:', err);
            return res.status(500).json({ message: 'Failed to fetch appointments' });
        }
        console.log('Fetched appointments for doctor:', results); // Log the fetched appointment data
        res.json(results);
    });
});

app.get('/past-appointments', (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];
    let decoded;

    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = decoded.userId;
    const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.query(`
        SELECT doctors.name AS doctor_name, doctors.surname AS doctor_surname, appointments.date, appointments.time 
        FROM appointments 
        JOIN doctors ON appointments.doctor_id = doctors.id 
        WHERE appointments.patient_id = (SELECT id FROM patients WHERE user_id = ?) 
        AND CONCAT(appointments.date, ' ', appointments.time) < ? 
        ORDER BY appointments.date DESC, appointments.time DESC
    `, [userId, currentDateTime], (err, results) => {
        if (err) {
            console.error('Failed to fetch past appointments:', err);
            return res.status(500).json({ message: 'Failed to fetch past appointments' });
        }
        res.json(results);
    });
});

app.get('/future-appointments', (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];
    let decoded;

    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = decoded.userId;
    const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.query(`
        SELECT doctors.name AS doctor_name, doctors.surname AS doctor_surname, appointments.date, appointments.time 
        FROM appointments 
        JOIN doctors ON appointments.doctor_id = doctors.id 
        WHERE appointments.patient_id = (SELECT id FROM patients WHERE user_id = ?) 
        AND CONCAT(appointments.date, ' ', appointments.time) >= ? 
        ORDER BY appointments.date ASC, appointments.time ASC
    `, [userId, currentDateTime], (err, results) => {
        if (err) {
            console.error('Failed to fetch future appointments:', err);
            return res.status(500).json({ message: 'Failed to fetch future appointments' });
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
