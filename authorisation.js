document.addEventListener("DOMContentLoaded", function() {
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

    function addAvailabilityEntry() {
        const availabilityDiv = document.getElementById('availability');
        const newEntry = document.createElement('div');
        newEntry.className = 'availability-entry';
        newEntry.innerHTML = `
            <select name="day_of_week[]">
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
            </select>
            <input type="time" name="start_time[]">
            <input type="time" name="end_time[]">
        `;
        availabilityDiv.appendChild(newEntry);
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

    window.addAvailabilityEntry = addAvailabilityEntry;
    window.showLoginForm = showLoginForm;
    window.showRegistrationForm = showRegistrationForm;
    window.showPatientRegistration = showPatientRegistration;
    window.showDoctorRegistration = showDoctorRegistration;

    showLoginForm();
});
