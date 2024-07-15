document.addEventListener("DOMContentLoaded", function() {
    let token = null;
    let patientId = null;

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
            if (data.token) {
                token = data.token;
                patientId = data.userId;
                document.getElementById('authForms').style.display = 'none';
                document.getElementById('appointmentSection').style.display = 'block';
                loadSpecialists();
                loadAppointments();
            } else {
                alert('Login failed');
            }
        })
        .catch(error => console.error('Error:', error));
    });

    document.getElementById('specialistFilter').addEventListener('change', function() {
        const specialist = this.value;
        loadDoctors(specialist);
    });

    document.getElementById('doctor').addEventListener('change', function() {
        const doctorId = this.value;
        loadAvailableSlots(doctorId);
    });

    function loadSpecialists() {
        fetch('http://localhost:3000/specialists', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(specialists => {
            const specialistFilter = document.getElementById('specialistFilter');
            specialistFilter.innerHTML = '<option value="">Select Specialist</option>';
            specialists.forEach(specialist => {
                const option = document.createElement('option');
                option.value = specialist.specialist;
                option.textContent = specialist.specialist;
                specialistFilter.appendChild(option);
            });
        })
        .catch(error => console.error('Error:', error));
    }

    function loadDoctors(specialist = '') {
        fetch(`http://localhost:3000/doctors?specialist=${specialist}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(doctors => {
            const doctorSelect = document.getElementById('doctor');
            doctorSelect.innerHTML = '';
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `${doctor.name} ${doctor.surname}`;
                doctorSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error:', error));
    }

    function loadAvailableSlots(doctorId) {
        fetch(`http://localhost:3000/doctor-availability?doctorId=${doctorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            const slotContainer = document.getElementById('slotContainer');
            slotContainer.innerHTML = '';

            const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const slots = {};

            weekDays.forEach(day => {
                slots[day] = [];
                const dayAvailability = data.filter(slot => slot.day_of_week === day);

                if (dayAvailability.length > 0) {
                    const { start_time, end_time } = dayAvailability[0];
                    let currentTime = new Date(`1970-01-01T${start_time}`);
                    const endTime = new Date(`1970-01-01T${end_time}`);

                    while (currentTime < endTime) {
                        const slotTime = currentTime.toTimeString().substring(0, 5);
                        slots[day].push(slotTime);
                        currentTime.setMinutes(currentTime.getMinutes() + 30);
                    }
                }
            });

            const rowDiv = document.createElement('div');
            rowDiv.className = 'day-row';

            weekDays.forEach(day => {
                const dayDiv = document.createElement('div');
                dayDiv.className = 'day-column';
                dayDiv.innerHTML = `<h3>${day}</h3>`;

                slots[day].forEach(time => {
                    const slotDiv = document.createElement('div');
                    slotDiv.className = 'time-slot';
                    slotDiv.textContent = time;
                    slotDiv.addEventListener('click', () => selectSlot(day, time, slotDiv));
                    dayDiv.appendChild(slotDiv);
                });

                rowDiv.appendChild(dayDiv);
            });

            slotContainer.appendChild(rowDiv);
        })
        .catch(error => console.error('Error:', error));
    }

    function selectSlot(day, time, slotDiv) {
        const previouslySelected = document.querySelector('.time-slot.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        slotDiv.classList.add('selected');
        const currentDate = new Date();
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const selectedDate = new Date(currentDate.setDate(currentDate.getDate() + (dayOfWeek.indexOf(day) - currentDate.getDay())));
        const formattedDate = selectedDate.toISOString().split('T')[0];

        document.getElementById('selectedDate').value = formattedDate;
        document.getElementById('selectedTime').value = time;
    }

    document.getElementById('appointmentForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const doctorId = document.getElementById('doctor').value;
        const date = document.getElementById('selectedDate').value;
        const time = document.getElementById('selectedTime').value;

        const data = { doctorId, date, time };

        fetch('http://localhost:3000/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadAppointments();
        })
        .catch(error => console.error('Error:', error));
    });

    function loadAppointments() {
        fetch('http://localhost:3000/appointments', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(appointments => {
            const tbody = document.getElementById('appointmentsTable').querySelector('tbody');
            tbody.innerHTML = '';
            appointments.forEach(appointment => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${appointment.doctor_name} ${appointment.doctor_surname}</td>
                    <td>${appointment.date}</td>
                    <td>${appointment.time}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error:', error));
    }

    window.addAvailabilityEntry = addAvailabilityEntry;
    window.showLoginForm = showLoginForm;
    window.showRegistrationForm = showRegistrationForm;
    window.showPatientRegistration = showPatientRegistration;
    window.showDoctorRegistration = showDoctorRegistration;
});
