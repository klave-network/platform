import { Outlet } from 'react-router-dom';
import Landing from './routes/landing';
import api from './utils/api';
// import { useAuth } from './AuthProvider';

export const ProtectedLayout = () => {
    // const { user } = useAuth();
    const { data, isLoading } = api.v0.auth.getSession.useQuery();

    if (isLoading)
        return <Outlet />;

    if (data?.hasUnclaimedApplications || data?.me)
        return <Outlet />;

    return <Landing />;
    // return <Navigate to="/login" />;
};