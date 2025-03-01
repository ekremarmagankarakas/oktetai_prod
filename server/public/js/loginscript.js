// Password visibility toggle logic - updated for multiple password fields
document.addEventListener('DOMContentLoaded', function() {
    // Setup toggle for primary password field
    const passwordToggle1 = document.querySelector('.password-toggle-1');
    if (passwordToggle1) {
        passwordToggle1.addEventListener('click', function () {
            const passwordField = document.getElementById('password');
            togglePasswordVisibility(passwordField, this);
        });
    }
    
    // Setup toggle for confirm password field
    const passwordToggle2 = document.querySelector('.password-toggle-2');
    if (passwordToggle2) {
        passwordToggle2.addEventListener('click', function () {
            const confirmPasswordField = document.getElementById('confirmPassword');
            togglePasswordVisibility(confirmPasswordField, this);
        });
    }
    
    // For backwards compatibility with pages that still use the old selector
    const legacyToggle = document.querySelector('.toggle-password:not(.password-toggle-1):not(.password-toggle-2)');
    if (legacyToggle) {
        legacyToggle.addEventListener('click', function () {
            const passwordField = document.getElementById('password');
            togglePasswordVisibility(passwordField, this);
        });
    }
    
    // Password match validation
    const confirmPasswordField = document.getElementById('confirmPassword');
    if (confirmPasswordField) {
        const passwordField = document.getElementById('password');
        
        // Add validation when user types in either field
        passwordField.addEventListener('input', validatePasswordMatch);
        confirmPasswordField.addEventListener('input', validatePasswordMatch);
        
        // Validate password complexity
        passwordField.addEventListener('input', function() {
            validatePasswordStrength(this.value);
        });
    }
    
    // Password toggle helper function
    function togglePasswordVisibility(field, toggleElement) {
        if (field.type === "password") {
            field.type = "text";
            toggleElement.textContent = '🙈'; // Change the icon to a closed eye
        } else {
            field.type = "password";
            toggleElement.textContent = '👁'; // Change the icon back to open eye
        }
    }
    
    // Validate that passwords match
    function validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const signUpButton = document.querySelector('.sign-in-button');
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordField.setCustomValidity('Passwords do not match');
            confirmPasswordField.style.borderColor = '#ff3860';
        } else {
            confirmPasswordField.setCustomValidity('');
            confirmPasswordField.style.borderColor = '';
        }
    }
    
    // Validate password strength
    function validatePasswordStrength(password) {
        const passwordField = document.getElementById('password');
        const requirementsElement = document.querySelector('.password-requirements small');
        
        // Regex patterns for password requirements
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        const isLongEnough = password.length >= 8;
        
        // Check if all requirements are met
        const isStrong = hasUppercase && hasLowercase && hasNumber && hasSpecial && isLongEnough;
        
        if (isStrong) {
            passwordField.style.borderColor = '#23d160';
            if (requirementsElement) {
                requirementsElement.style.color = '#23d160';
            }
        } else {
            passwordField.style.borderColor = password ? '#ff3860' : '';
            if (requirementsElement) {
                requirementsElement.style.color = '';
            }
        }
    }
});
