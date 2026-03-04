import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);       // { username, role, student_id, email }
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);  // true while verifying on mount

    // On mount: verify cached token with backend
    useEffect(() => {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');
        if (!savedToken) { setLoading(false); return; }

        api.verifyToken()
            .then(() => {
                setToken(savedToken);
                setUser(savedUser ? JSON.parse(savedUser) : null);
            })
            .catch(() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
            })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback((tokenVal, userObj) => {
        localStorage.setItem('auth_token', tokenVal);
        localStorage.setItem('auth_user', JSON.stringify(userObj));
        setToken(tokenVal);
        setUser(userObj);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
    }, []);

    const isAdmin = () => user?.role === 'admin';
    const isStudent = () => user?.role === 'student';

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isStudent }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
