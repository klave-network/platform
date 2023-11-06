import { FC, useRef } from 'react';
import { useToggle, useEventListener } from 'usehooks-ts';
import LoginSecKey from '../partials/LoginSecKey';
import LoginQR from '../partials/LoginQR';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

export const Login: FC = () => {

    const [newPipe, togglePipe] = useToggle(import.meta.env['NODE_ENV'] === 'development');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const navigate = useNavigate();
    const { data } = api.v0.auth.getSession.useQuery();

    const onKeyDown = (event: KeyboardEvent) => {
        if (event.altKey && event.code === 'KeyO')
            togglePipe();
    };

    const onMessage = (event: MessageEvent) => {
        if (event.data.source !== 'react-devtools-content-script')
            console.log(event.origin, ': ', event.data);

    };

    useEventListener('keydown', onKeyDown);
    useEventListener('message', onMessage);

    if (data?.me)
        navigate('/');

    if (newPipe) {

        const state = JSON.stringify({
            referer: window.location.origin,
            source: 'klave'
        });

        const secretariumAuth = new URL(`${import.meta.env['VITE_SECRETARIUM_ID_URL']}/login/oauth/authorize'}`);
        secretariumAuth.searchParams.append('client_id', import.meta.env['VITE_KLAVE_SELF_CLIENT_ID'] ?? '');
        secretariumAuth.searchParams.append('scope', 'read:user,read:gpg_key,read:public_key');
        secretariumAuth.searchParams.append('state', state);
        secretariumAuth.searchParams.append('post_messaging', 'true');
        secretariumAuth.searchParams.append('redirc', 'true');

        return <div id="login">

            <div className="flex flex-col sm:flex-row max-w-6xl mx-auto gap-12 px-4 sm:px-6">
                <iframe ref={iframeRef} loading='eager' sandbox='allow-modals allow-scripts' src={secretariumAuth.toString()} className='w-[40vw] h-[50vh]' />
            </div>

        </div>;
    }

    return <div id="login">

        <div className="flex flex-col sm:flex-row max-w-6xl mx-auto gap-12 px-4 sm:px-6">
            <div className="p-5 min-w-[300px] bg-slate-100 dark:bg-gray-800 rounded-md">
                <LoginSecKey />
            </div>
            <div className="p-5 min-w-[300px] bg-slate-100 dark:bg-gray-800 rounded-md">
                <LoginQR />
            </div>
        </div>

    </div>;
};

export default Login;