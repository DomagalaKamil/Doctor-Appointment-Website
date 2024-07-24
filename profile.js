document.addEventListener('DOMContentLoaded', function() {
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('User not logged in');
        window.location.href = 'index.html';
        return;
    }

    // Fetch profile data
    function fetchProfile() {
        fetch(`http://localhost:3000/user/${userId}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                const profileInfo = document.getElementById('profileInfo');
                profileInfo.innerHTML = `
                    <h2>${data.name} ${data.surname}</h2>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Date of Birth:</strong> ${data.dob.split('T')[0]}</p>
                    <h3>Address:</h3>
                    <p>${data.street} ${data.building_number}</p>
                    <p>${data.city}</p>
                    <p>${data.postcode}</p>
                    <p>${data.country}</p>
                `;

                // Prefill address form
                document.getElementById('street').value = data.street;
                document.getElementById('building_number').value = data.building_number;
                document.getElementById('city').value = data.city;
                document.getElementById('postcode').value = data.postcode;
                document.getElementById('country').value = data.country;
            })
            .catch(error => {
                console.error('Error fetching profile data:', error);
                alert('Error fetching profile data');
            });
    }

    fetchProfile();

    // Update email form submission
    document.getElementById('updateEmailForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const currentPassword = document.getElementById('currentPasswordEmail').value;
        const newEmail = document.getElementById('newEmail').value;

        fetch(`http://localhost:3000/update-email/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newEmail })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Email updated successfully');
                closeModal();  // Close the modal after updating
                fetchProfile();  // Refresh profile data
            }
        })
        .catch(error => {
            console.error('Error updating email:', error);
            alert('Error updating email');
        });
    });

    // Update password form submission
    document.getElementById('updatePasswordForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            alert('New passwords do not match');
            return;
        }

        fetch(`http://localhost:3000/update-password/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Password updated successfully');
                closeModal();  // Close the modal after updating
                fetchProfile();  // Refresh profile data
            }
        })
        .catch(error => {
            console.error('Error updating password:', error);
            alert('Error updating password');
        });
    });

    // Update address form submission
    document.getElementById('updateAddressForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const currentPassword = document.getElementById('currentPasswordAddress').value;
        const street = document.getElementById('street').value;
        const building_number = document.getElementById('building_number').value;
        const city = document.getElementById('city').value;
        const postcode = document.getElementById('postcode').value;
        const country = document.getElementById('country').value;

        fetch(`http://localhost:3000/update-address/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, street, building_number, city, postcode, country })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                alert('Address updated successfully');
                closeModal();  // Close the modal after updating
                fetchProfile();  // Refresh profile data
            }
        })
        .catch(error => {
            console.error('Error updating address:', error);
            alert('Error updating address');
        });
    });
});
