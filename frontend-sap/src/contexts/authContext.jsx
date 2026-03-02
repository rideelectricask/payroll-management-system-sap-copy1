import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = 'https://backend-pms-production-0cec.up.railway.app/api';

export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(null);
const [token, setToken] = useState(localStorage.getItem('token'));
const [loading, setLoading] = useState(true);

useEffect(() => {
const verifyToken = async () => {
const storedToken = localStorage.getItem('token');

if (!storedToken) {
setLoading(false);
return;
}

try {
const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
headers: {
Authorization: `Bearer ${storedToken}`
}
});

if (response.data.success) {
setUser(response.data.user);
setToken(storedToken);
} else {
localStorage.removeItem('token');
setToken(null);
setUser(null);
}
} catch (error) {
console.error('Token verification failed:', error);
localStorage.removeItem('token');
setToken(null);
setUser(null);
} finally {
setLoading(false);
}
};

verifyToken();
}, []);

const login = async (username, email) => {
try {
const response = await axios.post(`${API_BASE_URL}/auth/login`, {
username,
email
});

if (response.data.success) {
const { token, user } = response.data;
localStorage.setItem('token', token);
setToken(token);
setUser(user);
return { success: true, user };
}

return { success: false, message: response.data.message };
} catch (error) {
console.error('Login failed:', error);
return {
success: false,
message: error.response?.data?.message || 'Login failed'
};
}
};

const logout = async () => {
try {
if (token) {
await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
headers: {
Authorization: `Bearer ${token}`
}
});
}
} catch (error) {
console.error('Logout error:', error);
} finally {
localStorage.removeItem('token');
setToken(null);
setUser(null);
}
};

const refreshUser = async () => {
if (!token) return;

try {
const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
headers: {
Authorization: `Bearer ${token}`
}
});

if (response.data.success) {
setUser(response.data.user);
}
} catch (error) {
console.error('User refresh failed:', error);
}
};

const value = {
user,
token,
loading,
login,
logout,
refreshUser,
isAuthenticated: !!token && !!user
};

return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
const context = useContext(AuthContext);
if (!context) {
throw new Error('useAuth must be used within an AuthProvider');
}
return context;
};