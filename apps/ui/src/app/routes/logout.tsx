import { FC, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

export const Logout: FC = () => {

    const navigate = useNavigate();
    const { invalidate } = api.useUtils().v0.auth.getSession;
    const { mutateAsync, isIdle } = api.v0.auth.logOut.useMutation();

    useEffect(() => {
        if (isIdle)
            mutateAsync()
                .then(() => invalidate())
                .then(() => {
                    navigate('/');
                });
    }, [invalidate, isIdle, mutateAsync, navigate]);

    return <div id="login">

        <div className="flex flex-col sm:flex-row max-w-6xl mx-auto px-4 sm:px-6">
            <div className="p-5 min-w-[300px] bg-slate-100">
                Please wait while we are logging you out...
            </div>
        </div>

    </div>;
};

export default Logout;