import React, { useState, useEffect } from 'react';
import api from '../services/api';
import socket from '../utils/socket';
import { User, LoginCredentials, RegisterData } from '../types/auth';
import { AuthContext } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data.user);
                socket.emit('join', { userId: response.data.user.id, role: response.data.user.role });
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const response = await api.post('/auth/login', credentials);
        const loggedUser = response.data.user;
        setUser(loggedUser);
        socket.emit('join', { userId: loggedUser.id, role: loggedUser.role });
    };

    const register = async (data: RegisterData) => {
        await api.post('/auth/register', data);
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
