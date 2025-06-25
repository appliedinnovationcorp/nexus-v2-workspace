/*
Auto-generated for feature-001-user-login.md

# Feature 001: User Login

## Description
Implement a secure user login system with email and password.

## Requirements
- Validate email and password inputs.
- Authenticate user against the database.
- Provide error messages for invalid credentials.
- Redirect to dashboard on success.

## Acceptance Criteria
- User can log in with valid credentials.
- User sees error messages on invalid inputs.
- Sessions last 30 minutes of inactivity.


Implementation starts below:
*/

// TODO: Implement feature here
function userLogin(email, password) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
    }

    // Validate password length
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }

    // Simulate user authentication (replace with actual database logic)
    const usersDB = [
        { email: 'user@example.com', password: 'password123' }
    ];

    const user = usersDB.find(u => u.email === email);
    if (!user) {
        throw new Error('User not found');
    }

    if (user.password !== password) {
        throw new Error('Invalid password');
    }

    // If we reach this point, authentication was successful
    console.log('User logged in successfully');
}
// Example usage
try {
    userLogin('user@example.com', 'password123');
} catch (error) {
    console.error('Login failed:', error.message);
}
// Example usage
try {
    userLogin('invalid-email', 'short');
} catch (error) {
    console.error('Login failed:', error.message);
}

