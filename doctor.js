document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem('token');

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
                    <td>${appointment.patient_name} ${appointment.patient_surname}</td>
                    <td>${appointment.date}</td>
                    <td>${appointment.time}</td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(error => console.error('Error:', error));
    }

    loadAppointments();
});
