document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem('token');
    const patientId = localStorage.getItem('userId');

    let currentStartDate = new Date();
    currentStartDate.setHours(0, 0, 0, 0);
    currentStartDate.setDate(currentStartDate.getDate() - currentStartDate.getDay() + 1);

    document.getElementById('specialistFilter').addEventListener('change', function() {
        const specialist = this.value;
        loadDoctors(specialist);
    });

    document.getElementById('doctor').addEventListener('change', function() {
        const doctorId = this.value;
        loadAvailableSlots(doctorId);
    });

    document.getElementById('prevWeek').addEventListener('click', function() {
        currentStartDate.setDate(currentStartDate.getDate() - 7);
        updateCalendar();
    });

    document.getElementById('nextWeek').addEventListener('click', function() {
        currentStartDate.setDate(currentStartDate.getDate() + 7);
        updateCalendar();
    });

    function updateCalendar() {
        const endDate = new Date(currentStartDate);
        endDate.setDate(currentStartDate.getDate() + 6);

        const options = { month: 'short', day: 'numeric' };
        document.getElementById('currentWeek').textContent = `${currentStartDate.toLocaleDateString(undefined, options)} - ${endDate.toLocaleDateString(undefined, options)}`;

        const doctorId = document.getElementById('doctor').value;
        if (doctorId) {
            loadAvailableSlots(doctorId);
        }
    }

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
        .then(availabilityData => {
            fetch(`http://localhost:3000/appointments?doctorId=${doctorId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => response.json())
            .then(appointmentData => {
                const slotContainer = document.getElementById('slotContainer');
                slotContainer.innerHTML = '';

                const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                const slots = {};

                weekDays.forEach((day, index) => {
                    slots[day] = [];
                    const dayAvailability = availabilityData.filter(slot => slot.day_of_week === day);

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

                    const dayDate = new Date(currentStartDate);
                    dayDate.setDate(currentStartDate.getDate() + index);

                    const dayDiv = document.createElement('div');
                    dayDiv.className = 'day-column';
                    dayDiv.innerHTML = `<h3>${day} (${dayDate.toLocaleDateString()})</h3>`;

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    slots[day].forEach(time => {
                        const slotDiv = document.createElement('div');
                        slotDiv.className = 'time-slot';
                        slotDiv.textContent = time;

                        const isPast = dayDate < today || (dayDate.getTime() === today.getTime() && new Date(`1970-01-01T${time}`) <= new Date());
                        const isBooked = appointmentData.some(appointment => appointment.date === dayDate.toISOString().split('T')[0] && appointment.time === time);

                        if (isPast || isBooked) {
                            slotDiv.classList.add('unavailable');
                            slotDiv.style.pointerEvents = 'none';
                            slotDiv.style.backgroundColor = '#d3d3d3';
                        } else {
                            slotDiv.addEventListener('click', () => selectSlot(dayDate, time, slotDiv));
                        }
                        dayDiv.appendChild(slotDiv);
                    });

                    slotContainer.appendChild(dayDiv);
                });
            })
            .catch(error => console.error('Error fetching appointments:', error));
        })
        .catch(error => console.error('Error fetching availability:', error));
    }

    function selectSlot(date, time, slotDiv) {
        const previouslySelected = document.querySelector('.time-slot.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        slotDiv.classList.add('selected');

        const formattedDate = date.toISOString().split('T')[0];
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
            if (data.message === 'Time slot already booked') {
                alert('This time slot is already booked. Please choose another slot.');
            } else {
                alert(data.message);
            }
            loadAvailableSlots(doctorId);  // Reload the slots to reflect the new booking
            loadAppointments();  // Reload the user's appointments
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

    loadSpecialists();
    loadAppointments();
    updateCalendar();
});
