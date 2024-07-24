document.addEventListener("DOMContentLoaded", function() {
    function showLoginForm() {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registrationOptions').style.display = 'none';
        document.getElementById('patientRegistrationForm').classList.remove('active');
        document.getElementById('doctorRegistrationForm').classList.remove('active');
    }

    function showRegistrationForm() {
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registrationOptions').style.display = 'block';
        document.getElementById('patientRegistrationForm').classList.remove('active');
        document.getElementById('doctorRegistrationForm').classList.remove('active');
    }

    function showPatientRegistration() {
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registrationOptions').style.display = 'none';
        document.getElementById('patientRegistrationForm').classList.add('active');
        document.getElementById('doctorRegistrationForm').classList.remove('active');
    }

    function showDoctorRegistration() {
        document.getElementById('loginForm').classList.remove('active');
        document.getElementById('registrationOptions').style.display = 'none';
        document.getElementById('patientRegistrationForm').classList.remove('active');
        document.getElementById('doctorRegistrationForm').classList.add('active');
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

        const availabilityEntries = document.querySelectorAll('.availability-entry');
        data.availability = Array.from(availabilityEntries).map(entry => {
            return {
                day_of_week: entry.querySelector('[name="day_of_week[]"]').value,
                start_time: entry.querySelector('[name="start_time[]"]').value,
                end_time: entry.querySelector('[name="end_time[]"]').value
            };
        });

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
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Login response:', data);  // Log the response for debugging

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userId', data.userId);

                window.location.href = 'home.html';
            } else {
                alert('Login failed');
            }
        })
        .catch(error => console.error('Error:', error));
    });

    window.showLoginForm = showLoginForm;
    window.showRegistrationForm = showRegistrationForm;
    window.showPatientRegistration = showPatientRegistration;
    window.showDoctorRegistration = showDoctorRegistration;

    showLoginForm();
});
