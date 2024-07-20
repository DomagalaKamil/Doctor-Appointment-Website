document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem('token');
    const patientId = localStorage.getItem('userId');
    let bookedAppointments = [];

    let currentStartDate = new Date();
    currentStartDate.setHours(0, 0, 0, 0);
    currentStartDate.setDate(currentStartDate.getDate() - currentStartDate.getDay() + 1);

    document.getElementById('specialistFilter').addEventListener('change', function() {
        const specialist = this.value;
        loadDoctors(specialist);
    });

    document.getElementById('doctor').addEventListener('change', function() {
        const doctorId = this.value;
        if (doctorId) {
            document.getElementById('calendarNav').style.display = 'flex';
            document.getElementById('descriptionField').style.display = 'block';
            document.getElementById('bookButton').style.display = 'block';
            loadAvailableSlots(doctorId);
            loadAppointments(doctorId); // Load appointments for the selected doctor
        } else {
            document.getElementById('calendarNav').style.display = 'none';
            document.getElementById('descriptionField').style.display = 'none';
            document.getElementById('bookButton').style.display = 'none';
        }
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

            // Hide calendar navigation and description field until a doctor is selected
            document.getElementById('calendarNav').style.display = 'none';
            document.getElementById('descriptionField').style.display = 'none';
            document.getElementById('bookButton').style.display = 'none';
        })
        .catch(error => console.error('Error:', error));
    }

    function loadAvailableSlots(doctorId) {
        fetch(`http://localhost:3000/doctor-availability?doctorId=${doctorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(availabilityData => {
            console.log('Fetched availability data:', availabilityData); // Debug statement

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

                slots[day].forEach(time => {
                    const slotDiv = document.createElement('div');
                    slotDiv.className = 'time-slot';

                    // Adjust the date for checking against appointment data
                    const adjustedDate = new Date(dayDate);

                    const formattedDate = formatDate(adjustedDate);

                    console.log(`Checking slot: ${formattedDate} ${time}`); // Debug statement

                    if (isPast(adjustedDate) || isBooked(formattedDate, time)) {
                        slotDiv.classList.add('unavailable');
                        slotDiv.style.pointerEvents = 'none';
                        slotDiv.style.backgroundColor = '#d3d3d3';
                        slotDiv.textContent = isBooked(formattedDate, time) ? `${time} - Booked` : time;
                    } else {
                        slotDiv.textContent = time;
                        slotDiv.addEventListener('click', () => selectSlot(adjustedDate, time, slotDiv));
                    }
                    dayDiv.appendChild(slotDiv);
                });

                slotContainer.appendChild(dayDiv);
            });
        })
        .catch(error => console.error('Error fetching availability:', error));
    }

    function loadAppointments(doctorId) {
        fetch(`http://localhost:3000/appointments?doctorId=${doctorId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(appointments => {
            bookedAppointments = appointments; // Store appointments in array
        })
        .catch(error => console.error('Error:', error));
    }

    function isPast(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = date < today;
        console.log(`isPast: ${isPast} for date: ${date}`); // Debug statement
        return isPast;
    }

    function isBooked(date, time) {
        const booked = bookedAppointments.some(appointment => {
            const appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
            const appointmentTime = appointment.time.substring(0, 5); // Extract hours and minutes only
            const isBooked = appointmentDate === date && appointmentTime === time;
            console.log(`Comparing: ${appointmentDate} === ${date} && ${appointmentTime} === ${time} => ${isBooked}`); // Debug statement
            return isBooked;
        });
        console.log(`isBooked: ${booked} for date: ${date} and time: ${time}`); // Debug statement
        return booked;
    }

    function selectSlot(date, time, slotDiv) {
        const previouslySelected = document.querySelector('.time-slot.selected');
        if (previouslySelected) {
            previouslySelected.classList.remove('selected');
        }

        slotDiv.classList.add('selected');

        const formattedDate = formatDate(date);
        document.getElementById('selectedDate').value = formattedDate;
        document.getElementById('selectedTime').value = time;
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    document.getElementById('appointmentForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const doctorId = document.getElementById('doctor').value;
        const date = document.getElementById('selectedDate').value;
        const time = document.getElementById('selectedTime').value;
        const problemDescription = document.getElementById('problemDescription').value;

        const data = { doctorId, date, time, problemDescription };

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
            loadAppointments(doctorId);  // Reload the user's appointments
        })
        .catch(error => console.error('Error:', error));
    });

    loadSpecialists();
    updateCalendar();
});
