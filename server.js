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
            console.error(err);
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
        res.json({ token, userId: user.id });
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
    const decoded = jwt.verify(token, secretKey);

    if (!decoded) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { doctorId, date, time } = req.body;
    const patientUserId = decoded.userId;

    // Check if doctorId and patientUserId are valid
    db.query('SELECT id FROM patients WHERE user_id = ?', [patientUserId], (err, patientResults) => {
        if (err || patientResults.length === 0) {
            console.error('Failed to fetch patient information:', err);
            return res.status(500).json({ message: 'Failed to fetch patient information' });
        }
        
        const validPatientId = patientResults[0].id;

        db.query('SELECT id FROM doctors WHERE id = ?', [doctorId], (err, doctorResults) => {
            if (err || doctorResults.length === 0) {
                console.error('Failed to fetch doctor information:', err);
                return res.status(500).json({ message: 'Failed to fetch doctor information' });
            }

            const validDoctorId = doctorResults[0].id;

            db.query('INSERT INTO appointments (patient_id, doctor_id, date, time) VALUES (?, ?, ?, ?)', [validPatientId, validDoctorId, date, time], err => {
                if (err) {
                    console.error('Failed to book appointment:', err);
                    return res.status(500).json({ message: 'Failed to book appointment' });
                }
                res.json({ message: 'Appointment booked successfully' });
            });
        });
    });
});

app.get('/appointments', (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];
    const decoded = jwt.verify(token, secretKey);

    if (!decoded) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = decoded.userId;
    const role = decoded.role;

    if (role === 'patient') {
        db.query('SELECT doctors.name AS doctor_name, doctors.surname AS doctor_surname, appointments.date, appointments.time FROM appointments JOIN doctors ON appointments.doctor_id = doctors.id WHERE appointments.patient_id = (SELECT id FROM patients WHERE user_id = ?)', [userId], (err, results) => {
            if (err) {
                console.error('Failed to fetch appointments:', err);
                return res.status(500).json({ message: 'Failed to fetch appointments' });
            }
            res.json(results);
        });
    } else if (role === 'doctor') {
        db.query('SELECT patients.name AS patient_name, patients.surname AS patient_surname, appointments.date, appointments.time FROM appointments JOIN patients ON appointments.patient_id = patients.id WHERE appointments.doctor_id = (SELECT id FROM doctors WHERE user_id = ?)', [userId], (err, results) => {
            if (err) {
                console.error('Failed to fetch appointments:', err);
                return res.status(500).json({ message: 'Failed to fetch appointments' });
            }
            res.json(results);
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
