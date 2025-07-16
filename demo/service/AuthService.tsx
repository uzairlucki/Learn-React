// app/service/AuthService.ts

interface AuthResponse {
    success: boolean;
    message: string;
}

export const login = async (
    username: string,
    password: string
): Promise<AuthResponse> => {
    try {
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data: { message: string } = await response.json();
            // Handle successful login, e.g., store a token or user info
            console.log('Login successful:', data);
            return { success: true, message: data.message };
        } else {
            const errorData: { message?: string } = await response.json();
            console.error('Login failed:', errorData);
            return { success: false, message: errorData.message || 'Login failed' };
        }
    } catch (error) {
        console.error('Error during login:', error);
        return { success: false, message: 'Network error or server unavailable' };
    }
};

export const logout = async () => {
    try {
        const response = await fetch('http://localhost:8080/api/auth/logout', { // Adjust port if different
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // For logout, you might not need a body if the session is managed by cookies
            // If you're using token-based auth, you might send the token in headers
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Logout successful:', data);
            // Clear any stored authentication data (e.g., tokens, user info)
            return { success: true, message: data.message };
        } else {
            const errorData = await response.json();
            console.error('Logout failed:', errorData);
            return { success: false, message: errorData.message || 'Logout failed' };
        }
    } catch (error) {
        console.error('Error during logout:', error);
        return { success: false, message: 'Network error or server unavailable' };
    }
};