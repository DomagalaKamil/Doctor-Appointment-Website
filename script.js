document.addEventListener("DOMContentLoaded", function() {
    let token = null;

    function showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registrationOptions').style.display = 'none';
        document.getElementById('patientRegistrationForm').style.display = 'none';
        document.getElementById('doctorRegistrationForm').style.display = 'none';
    }

    function showRegistrationForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registrationOptions').style.display = 'block';
    }

    function showPatientRegistration() {
        document.getElementById('patientRegistrationForm').style.display = 'block';
        document.getElementById('doctorRegistrationForm').style.display = 'none';
    }

    function showDoctorRegistration() {
        document.getElementById('patientRegistrationForm').style.display = 'none';
        document.getElementById('doctorRegistrationForm').style.display = 'block';
    }

    document.getElementById('patientRegistrationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.role = 'patient';

        fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error('Error:', error));
    });

    document.getElementById('doctorRegistrationForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.role = 'doctor';

        fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => alert(data.message))
        .catch(error => console.error('Error:', error));
    });

    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            token = data.token;
            document.getElementById('authForms').style.display = 'none';
            document.getElementById('appointmentSection').style.display = 'block';
            loadDoctors();
            loadAppointments();
        })
        .catch(error => console.error('Error:', error));
    });

    document.getElementById('appointmentForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const doctor_id = document.getElementById('doctor').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;

        fetch('http://localhost:3000/appointments', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': token 
            },
            body: JSON.stringify({ doctor_id, date, time })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadAppointments();
        })
        .catch(error => console.error('Error:', error));
    });

    function loadDoctors() {
        fetch('http://localhost:3000/doctors', {
            headers: { 'Authorization': token }
        })
        .then(response => response.json())
        .then(data => {
            const doctorSelect = document.getElementById('doctor');
            doctorSelect.innerHTML = '';
            data.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = doctor.name;
                doctorSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error:', error));
    }

    function loadAppointments() {
        fetch('http://localhost:3000/appointments', {
            headers: { 'Authorization': token }
        })
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('appointmentsTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            data.forEach(appointment => {
                const row = tableBody.insertRow();
                const cell1 = row.insertCell(0);
                const cell2 = row.insertCell(1);
                const cell3 = row.insertCell(2);
                cell1.textContent = appointment.patient_name;
                cell2.textContent = appointment.date;
                cell3.textContent = appointment.time;
            });
        })
        .catch(error => console.error('Error:', error));
    }

    showLoginForm();

    window.showLoginForm = showLoginForm;
    window.showRegistrationForm = showRegistrationForm;
    window.showPatientRegistration = showPatientRegistration;
    window.showDoctorRegistration = showDoctorRegistration;
});
