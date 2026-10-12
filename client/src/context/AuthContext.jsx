import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '../api/api.js';

const AuthContext = createContext(null);
const IDLE_WARN_MS = 13 * 60 * 1000;   // 13 min
const IDLE_LOGOUT_MS = 15 * 60 * 1000; // 15 min

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => auth.getSession());
  const [loading, setLoading] = useState(false);
  const [idleWarning, setIdleWarning] = useState(false);
  const warnTimer = useRef(null);
  const logoutTimer = useRef(null);

  const resetIdleTimers = useCallback(() => {
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
    setIdleWarning(false);
    if (!auth.getSession()) return;
    warnTimer.current = setTimeout(() => setIdleWarning(true), IDLE_WARN_MS);
    logoutTimer.current = setTimeout(() => { handleLogout(); }, IDLE_LOGOUT_MS);
  }, []);

  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdleTimers));
    resetIdleTimers();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimers));
      clearTimeout(warnTimer.current);
      clearTimeout(logoutTimer.current);
    };
  }, [user, resetIdleTimers]);

  const handleLogin = async (username, password) => {
    setLoading(true);
    try {
      const result = await auth.login(username, password);
      setUser(result.user);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.logout();
    setUser(null);
    setIdleWarning(false);
    clearTimeout(warnTimer.current);
    clearTimeout(logoutTimer.current);
  };

  const handleChangePassword = async (currentPw, newPw) => {
    return await auth.changePassword(user.id, currentPw, newPw);
  };

  const hasRole = (...roles) => user && roles.includes(user.role);
  const can = (action) => {
    if (!user) return false;
    const perms = PERMISSIONS[user.role] || [];
    return perms.includes('*') || perms.includes(action);
  };

  return (
    <AuthContext.Provider value={{ user, loading, idleWarning, handleLogin, handleLogout, handleChangePassword, hasRole, can, resetIdleTimers }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Permission matrix (from Decisions doc section 3)
const PERMISSIONS = {
  RECEPTIONIST: [
    'patient:read', 'patient:create', 'patient:update',
    'appointment:read', 'appointment:create', 'appointment:checkin', 'appointment:cancel', 'appointment:noshow',
    'doctor:read',
    'bill:read',
  ],
  DOCTOR: [
    'patient:read',
    'appointment:read', 'appointment:complete',
    'doctor:read',
    'bill:read',
  ],
  CASHIER: [
    'patient:read',
    'appointment:read',
    'bill:read', 'bill:pay',
    'doctor:read',
  ],
  ADMIN: ['*'],
};

