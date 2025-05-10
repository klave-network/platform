import { FC, useEffect, useRef, useState } from 'react';
import { useToggle, useEventListener, useDebounceValue } from 'usehooks-ts';
import { z } from 'zod';
import LoginSecKey from '../partials/LoginSecKey';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useZodForm } from '../utils/useZodForm';
import { UilSpinner } from '@iconscout/react-unicons';

export const Login: FC = () => {

    const [newPipe, togglePipe] = useToggle(import.meta.env['NODE_ENV'] === 'development');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const navigate = useNavigate();
    const { data, refetch: refetchSession } = api.v0.auth.getSession.useQuery();
    const { mutateAsync: updateSlug, isPending: isChangingSlug } = api.v0.auth.updateSlug.useMutation();
    const [slug, setSlug] = useState('');
    const [skipAskName, setSkipAskName] = useState(false);
    const [debouncedSlug] = useDebounceValue(slug, 500);
    const { data: alreadyExists, isLoading: isCheckingIfExists } = api.v0.organisations.exists.useQuery({ orgSlug: debouncedSlug });

    const methods = useZodForm({
        schema: z.object({
            slug: z.string()
        }),
        values: {
            slug: slug.replaceAll(/\W/g, '-')
        }
    });

    useEffect(() => {
        if (data?.me) {
            if (!data.me.slug.startsWith('~$~') || skipAskName) {
                if (window.location.pathname === '/login' || window.location.pathname === '/login/')
                    navigate('/');
            }
        }
    }, [data, navigate, skipAskName]);

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

    if (data?.me) {
        if (data.me.slug.startsWith('~$~') && !skipAskName)
            return <div id="login">

                <div className="flex flex-col sm:flex-row max-w-6xl mx-auto gap-12 px-4 sm:px-6">
                    <div className="p-5 min-w-[300px] bg-slate-100 dark:bg-gray-800 rounded-md">
                        <div className="text-center pb-12 md:pb-16">
                            <br />
                            <div>
                                <h1 className='text-xl font-bold'>Welcome to Klave</h1>
                            </div>
                            <div>
                                So that other users of Klave can find you, please enter a pseudonym for yourself.<br />
                                This pseudonym may be made available to other users of the service.
                            </div>
                            <br />
                            <br />
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    methods.handleSubmit(async (data) => {
                                        await updateSlug(data, {
                                            onSuccess(data) {
                                                if (data?.ok) {
                                                    refetchSession().catch(() => { return; });
                                                    navigate('/');
                                                }
                                            }
                                        });
                                        methods.reset();
                                    })()
                                        .catch(() => { return; });
                                }}
                                className="space-y-2"
                            >
                                <div className='flex flex-col gap-3'>
                                    <label>
                                        <input {...methods.register('slug')} onChange={e => setSlug(e.target.value.trim())} className="input input-bordered border w-2/3" /><br />
                                        <div className='h-8'>{isCheckingIfExists
                                            ? <span className='block mt-1 text-xs leading-tight overflow-clip'><UilSpinner className='inline-block animate-spin h-5' /><br />&nbsp;</span>
                                            : alreadyExists
                                                ? <span className="block mt-1 text-xs text-red-700 leading-tight">The name <b>{slug}</b> already exists.<br />&nbsp;</span>
                                                : slug.length
                                                    ? <span className="block mt-1 text-xs text-green-700 leading-tight">This name is available !<br />Your URL on Klave will be https://klave.com/<b>{slug.toLocaleLowerCase()}</b></span>
                                                    : <span className="block mt-1 text-xs leading-tight">&nbsp;<br />&nbsp;</span>}
                                        </div>
                                    </label>

                                    {methods.formState.errors.slug?.message && (
                                        <p className="text-red-700">
                                            {methods.formState.errors.slug?.message}
                                        </p>
                                    )}
                                </div>
                                <div className='flex items-center justify-center gap-4'>
                                    <button
                                        type="submit"
                                        disabled={isChangingSlug}
                                        className="btn btn-md h-8 border text-white bg-blue-500 hover:bg-blue-400 p-2"
                                    >
                                        {isChangingSlug ? 'Setting up your pseudonym' : 'Set my pseudonymm'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSkipAskName(true)}
                                        className="btn btn-md h-8 border bg-slate-200 hover:bg-slate-300 p-2"
                                    >
                                        Skip for now
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

            </div>;
        return null;
    }

    if (newPipe) {

        const state = JSON.stringify({
            referer: window.location.origin,
            source: 'klave'
        });

        const secretariumAuth = new URL(`${window.klaveFrontConfig.SECRETARIUM_ID__}/login/oauth/authorize'}`);
        secretariumAuth.searchParams.append('client_id', import.meta.env['VITE_KLAVE_SELF_CLIENT_ID'] ?? '');
        secretariumAuth.searchParams.append('scope', 'read:user,read:gpg_key,read:public_key,repo,metadata:read,administration:write,contents:read');
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
        </div>

    </div>;
};

export default Login;