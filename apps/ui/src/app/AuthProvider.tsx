import { createContext, useContext, useMemo, FC, PropsWithChildren, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalForage } from './useLocalStorage';
import { httpApi } from './utils/api';

type AuthContextType = {
    user: Awaited<ReturnType<typeof httpApi.v0.auth.getSession.query>> | null;
    login: (data: Awaited<ReturnType<typeof httpApi.v0.auth.getSession.query>> | null) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => {
        return;
    },
    logout: () => {
        return;
    }
});

type AuthProviderProps = PropsWithChildren & {
    userData?: Awaited<ReturnType<typeof httpApi.v0.auth.getSession.query>>
}

export const AuthProvider: FC<AuthProviderProps> = ({ children, userData }) => {

    const [user, setUser] = useLocalForage('user', userData ?? null);
    const navigate = useNavigate();

    // call this function when you want to authenticate the user
    const login = useCallback(async (data: typeof user) => {
        setUser(data);
        navigate('/dashboard');
    }, [navigate, setUser]);

    // call this function to sign out logged in user
    const logout = useCallback(() => {
        fetch(`${window.klaveFrontConfig.KLAVE_API__}/logout`, {
            credentials: 'include'
        }).then(async res => res.json()).then(() => {
            setUser(null);
            navigate('/', { replace: true });
        }).catch(() => {
            console.error('Error logging out');
        });
    }, [navigate, setUser]);

    const value = useMemo(
        () => ({
            user,
            login,
            logout
        }),
        [login, logout, user]
    );
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};