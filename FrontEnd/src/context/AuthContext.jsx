import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const USERS_KEY = "scheduler-transformer-users";
const defaultUser = {
    username: "demo",
    firstName: "Sarah",
    lastName: "Martinez",
    password: "demo1234",
};

const readUsers = () => {
    const raw = localStorage.getItem(USERS_KEY);

    if (!raw) {
        localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser]));
        return [defaultUser];
    }

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [defaultUser];
    } catch {
        localStorage.setItem(USERS_KEY, JSON.stringify([defaultUser]));
        return [defaultUser];
    }
};

export const AuthProvider = ({ children }) => {
    const [users, setUsers] = useState(() => readUsers());
    const [sessionUsername, setSessionUsername] = useState(null);

    useEffect(() => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }, [users]);

    const currentUser = useMemo(
        () => users.find((user) => user.username === sessionUsername) ?? null,
        [sessionUsername, users],
    );

    const login = ({ username, password }) => {
        const user = users.find(
            (entry) => entry.username.toLowerCase() === username.trim().toLowerCase(),
        );

        if (!user || user.password !== password) {
            return { ok: false, message: "Nom d'utilisateur ou mot de passe incorrect." };
        }

        setSessionUsername(user.username);
        return { ok: true };
    };

    const signup = ({ username, firstName, lastName, password }) => {
        const normalizedUsername = username.trim();

        if (
            users.some(
                (entry) => entry.username.toLowerCase() === normalizedUsername.toLowerCase(),
            )
        ) {
            return { ok: false, message: "Ce nom d'utilisateur existe deja." };
        }

        const nextUser = {
            username: normalizedUsername,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            password,
        };

        setUsers((prev) => [...prev, nextUser]);
        setSessionUsername(nextUser.username);
        return { ok: true };
    };

    const logout = () => setSessionUsername(null);

    const updateProfile = (updates) => {
        if (!currentUser) return;

        setUsers((prev) =>
            prev.map((user) =>
                user.username === currentUser.username ? { ...user, ...updates } : user,
            ),
        );
    };

    const value = {
        currentUser,
        isAuthenticated: Boolean(currentUser),
        login,
        signup,
        logout,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider.");
    }

    return context;
};
