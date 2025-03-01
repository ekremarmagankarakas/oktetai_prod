// Password visibility toggle logic
document.querySelector('.toggle-password').addEventListener('click', function () {
    const passwordField = document.getElementById('password'); // Target by ID to ensure consistent behavior
    if (passwordField.type === "password") {
        passwordField.type = "text";
        this.textContent = '🙈'; // Change the icon to a closed eye
    } else {
        passwordField.type = "password";
        this.textContent = '👁'; // Change the icon back to open eye
    }
});
