import { createContext, useContext, useMemo, FC, PropsWithChildren, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalForage } from './useLocalStorage';

type AuthContextType = {
    user?: any;
    login: (data: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

type AuthProviderProps = PropsWithChildren & {
    userData?: any
}

export const AuthProvider: FC<AuthProviderProps> = ({ children, userData = {} }) => {

    const [user, setUser] = useLocalForage('user', userData ?? null);
    const navigate = useNavigate();

    // call this function when you want to authenticate the user
    const login = useCallback(async (data: any) => {
        setUser(data);
        navigate('/dashboard');
    }, [navigate, setUser]);

    // call this function to sign out logged in user
    const logout = useCallback(() => {
        fetch(`${import.meta.env['VITE_KLAVE_API_URL']}/logout`, {
            credentials: 'include'
        }).then(res => res.json()).then(() => {
            setUser(null);
            navigate('/', { replace: true });
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