import { FC, useState, useEffect, useCallback, ChangeEvent, MouseEvent } from 'react';
import { platformAuthenticatorIsAvailable, browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import api from '../utils/api';
import { UilSpinner } from '@iconscout/react-unicons';
import { useLocalForage } from '../useLocalStorage';
import { useDebounceValue } from 'usehooks-ts';
import { useLocation, useNavigate } from 'react-router-dom';

export const LoginSecKey: FC = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const [credentials, setCredentials] = useLocalForage<Array<string>>('enrolledCredentials', []);
    const [isRequestingWebauthnInput, setIsRequestingWebauthnInput] = useState(false);
    const [isWebauthAvailable, setIsWebauthAvailable] = useState<null | boolean>();
    const [shouldAttemptWebauthEnroll, setShouldAttemptWebauthEnroll] = useState(true);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [performedEmailCheck, setPerformedEmailCheck] = useState(false);
    const [error, setError] = useState<string>();
    const [screen, setScreen] = useState<'start' | 'code' | 'key'>('start');
    const [debouncedEmail] = useDebounceValue<string>(email, 200);
    const { mutate: emailCodeMutation, isPending: emailCodeLoading } = api.v0.auth.getEmailCode.useMutation();
    const { mutate: verifyEmailCodeMutation, isPending: verifyEmailCodeLoading } = api.v0.auth.verifyEmailCode.useMutation();
    const { mutate: validateWebauthnMutation, isPending: validateWebauthnLoading } = api.v0.auth.validateWebauthn.useMutation();
    const { mutate: registerWebauthnMutation, isPending: registerWebauthnLoading } = api.v0.auth.registerWebauthn.useMutation();
    const { refetch: refetchSession } = api.v0.auth.getSession.useQuery();
    const { refetch: refetchAuthOptions, isFetching: wauthOptionsLoading, error: webauthAuthError } = api.v0.auth.getWebauthAuthenticationOptions.useQuery({
        email
    }, {
        enabled: false,
        retry: false
    });
    const { refetch: refetchRegistrationOptions, isFetching: wregOptionsLoading, error: webauthRegError } = api.v0.auth.getWebauthRegistrationOptions.useQuery({
        email
    }, {
        enabled: false,
        retry: false
    });
    const { data: emailHint, refetch: refetchEmailHint, isFetching: isCheckingEmailHint, error: emailHintError } = api.v0.auth.getEmailHints.useQuery({
        partialEmail: email
    }, {
        enabled: false,
        retry: false
    });

    useEffect(() => {
        if (debouncedEmail.length > 0)
            refetchEmailHint()
                .catch(() => { return; });
    }, [debouncedEmail, refetchEmailHint]);

    useEffect(() => {
        if (credentials?.length === 1)
            setEmail(credentials[0] ?? '');
    }, [credentials]);

    // useEffect(() => {
    //     if (credentials?.length === 1 && email === credentials[0])
    //         startAuth();
    // }, [credentials, email, startAuth]);

    useEffect(() => {
        if (webauthAuthError) {
            setError(webauthAuthError.message ?? 'An error occured while trying to send your email code. Please try again later.');
        }
        if (webauthRegError) {
            setError(webauthRegError.message ?? 'An error occured while trying to send your email code. Please try again later.');
        }
    }, [webauthAuthError, webauthRegError]);

    useEffect(() => {
        if (isWebauthAvailable === undefined) {
            setIsWebauthAvailable(null);
            Promise.all([
                browserSupportsWebAuthn(),
                platformAuthenticatorIsAvailable()
            ])
                .then(statuses => statuses.reduce((prev, curr) => curr && prev, true))
                .then(setIsWebauthAvailable)
                .catch(() => setIsWebauthAvailable(false));
        }
    }, [isWebauthAvailable]);

    useEffect(() => {
        if (performedEmailCheck && isWebauthAvailable)
            startAuth();
    }, [performedEmailCheck]);

    const getLoginCode = useCallback(() => {
        emailCodeMutation({
            email
        }, {
            onSettled(data, error) {
                if (error) {
                    try {
                        const parsedError = JSON.parse(error.message) as Error;
                        setError(parsedError?.message ?? 'An error occured while trying to send your email code. Please try again later.');
                    } catch (e) {
                        console.error(e?.toString());
                        setError(error.message ?? 'An error occured while trying to send your email code. Please try again later.');
                    }
                } else if (data?.ok)
                    setScreen('code');
                else
                    setError('An error occured while trying to send your email code. Please try again later.');
            }
        });
    }, [email, emailCodeMutation]);

    const startAuth = useCallback(() => {

        if (email.length === 0) {
            setError('Please enter your email address');
            return;
        }

        if (!isWebauthAvailable)
            return getLoginCode();

        if (credentials?.includes(email)) {
            refetchAuthOptions()
                .then((res) => res.data)
                .then(async (options) => {
                    if (options) {
                        options.allowCredentials;
                        setIsRequestingWebauthnInput(true);
                        return startAuthentication({
                            optionsJSON: options
                            // useBrowserAutofill: true
                        });
                    }
                    throw new Error('No authentication options available');
                })
                .then(async (auth) => new Promise<ReturnType<typeof api.v0.auth.validateWebauthn.useMutation>['data']>((resolve, reject) => {
                    validateWebauthnMutation({
                        email,
                        data: auth
                    }, {
                        onSuccess: resolve,
                        onError: reject
                    });
                }))
                .then((res) => {
                    if (res?.ok) {
                        if (location.state?.from)
                            navigate(location.state?.from, {
                                state: {
                                    from: undefined
                                }
                            });
                        refetchSession()
                            .catch(() => { return; });
                        return;
                    }
                    if (res?.error) {
                        // setCredentials(credentials.filter(c => c !== email));
                        // setIsRequestingWebauthnInput(false);
                        setError(`${res.error}. Please try again.`);
                        return;
                    }
                })
                .catch((e) => {
                    setCredentials(credentials.filter(c => c !== email));
                    setIsRequestingWebauthnInput(false);
                    setError('A problem occurred while authenticating you. Please try again.');
                    console.error(e);
                });
            return;
        } else {
            if (!performedEmailCheck)
                return getLoginCode();
            refetchRegistrationOptions()
                .then((res) => res.data)
                .then(async (options) => {
                    if (options) {
                        setIsRequestingWebauthnInput(true);
                        return startRegistration({
                            optionsJSON: options
                            // useAutoRegister: true
                        });
                    }
                    throw new Error('No registration options available');
                })
                .then(async (reg) => new Promise<ReturnType<typeof api.v0.auth.registerWebauthn.useMutation>['data']>((resolve, reject) => {
                    registerWebauthnMutation({
                        email,
                        data: reg
                    }, {
                        onSuccess: resolve,
                        onError: reject
                    });
                }))
                .then((res) => {
                    if (res?.ok) {
                        setCredentials([...(credentials ?? []), email]);
                        if (location.state?.from)
                            navigate(location.state?.from, {
                                state: {
                                    from: undefined
                                }
                            });
                        refetchSession()
                            .catch(() => { return; });
                        return;
                    }
                    if (res?.error) {
                        setIsRequestingWebauthnInput(false);
                        setError(res.error);
                        return;
                    }
                })
                .catch((e) => {
                    console.error(e);
                    setIsRequestingWebauthnInput(false);
                    setError('An error occured while trying to register your passkey. Please try again later.');
                });
            return;
        }

    }, [credentials, performedEmailCheck, email, getLoginCode, isWebauthAvailable, refetchAuthOptions, refetchRegistrationOptions, refetchSession, registerWebauthnMutation, setCredentials, validateWebauthnMutation]);

    const verifyEmailCode = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (code.length === 0) {
            setError('Please enter your email code');
            return;
        }
        verifyEmailCodeMutation({
            email,
            code: code.replace(/\D/g, ''),
            authenticate: !isWebauthAvailable || !!credentials?.length || !shouldAttemptWebauthEnroll
        }, {
            onSettled(data, error) {
                if (error)
                    setError(error?.message ?? (JSON.parse(error.message) as Error[])[0]?.message ?? error.message ?? 'An error occured while trying to log you in. Please try again later.');
                else if (data?.ok) {
                    if (shouldAttemptWebauthEnroll && isWebauthAvailable && !credentials?.length) {
                        setPerformedEmailCheck(true);
                        setScreen('start');
                    } else
                        refetchSession()
                            .catch(() => { return; });
                } else
                    setError('An error occured while trying to log you in. Please try again later.');
            }
        });
    }, [code, verifyEmailCodeMutation, email, isWebauthAvailable, credentials?.length, shouldAttemptWebauthEnroll, refetchSession, startAuth]);

    const onChangeEmail = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (error)
            setError(undefined);
        setEmail(e.target.value);
    }, [error]);

    const onChangeCode = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (error)
            setError(undefined);
        setCode(e.target.value);
    }, [error]);

    const resetLogin = useCallback(() => {
        setEmail('');
        setCode('');
        setError(undefined);
        setScreen('start');
        setIsRequestingWebauthnInput(false);
        setShouldAttemptWebauthEnroll(true);
    }, [setEmail, setCode, setError]);

    const isLoading = emailCodeLoading || verifyEmailCodeLoading || wauthOptionsLoading || wregOptionsLoading || registerWebauthnLoading || isRequestingWebauthnInput || validateWebauthnLoading;

    const handleLoginSubmit = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        startAuth();
    }, [startAuth]);

    const handleLoginCodeSubmit = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setShouldAttemptWebauthEnroll(false);
        getLoginCode();
    }, [getLoginCode]);

    return <div className="text-center pb-12 md:pb-16">
        <br />
        <div className='pb-5' >
            {isWebauthAvailable && screen === 'start'
                ? <>
                    <h1 className='text-xl font-bold'>Passkey Login</h1>
                    <span>Connect with your Passkey.</span>
                </>
                : <>
                    <h1 className='text-xl font-bold'>Email Code</h1>
                    <span>Connect via an email code.</span>
                </>
            }
            <br />
            <br />
            <br />
        </div >
        <form className='relative'>
            {screen === 'start' ? <>
                <input key='emailField' value={email} onInput={onChangeEmail} alt='email' placeholder='Email address' type='email' className='input input-bordered text-center rounded-md text-black dark:text-white' />
                <div className='h-8'>
                    {emailHintError?.data || emailHint?.sucess === false
                        ? <span className="block mt-1 text-xs text-red-700 leading-tight">{emailHintError?.message ?? emailHint?.message ?? 'We encountered a problem.'}<br />&nbsp;</span>
                        : emailHint?.message
                            ? <span className="block mt-1 text-xs text-green-700 leading-tight">{emailHint?.message}</span>
                            : isCheckingEmailHint
                                ? <span className='block mt-1 text-xs leading-tight overflow-clip'><UilSpinner className='inline-block animate-spin h-5' /><br />&nbsp;</span>
                                : <span className="block mt-1 text-xs leading-tight">&nbsp;<br />&nbsp;</span>}
                </div>
                <button disabled={isLoading || emailHint?.sucess === false} onClick={handleLoginSubmit} onSubmit={handleLoginSubmit} type='submit' className='btn btn-md h-8 bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-300 rounded-md'>{isLoading ? <UilSpinner className='inline-block animate-spin h-5' /> : isWebauthAvailable ? 'Log in with a passkey' : 'Log in with email code'}</button><br />
                <button disabled={isLoading || emailHint?.sucess === false} onClick={handleLoginCodeSubmit} className='btn btn-md h-8 bg-transparent border-0 shadow-none font-normal text-sm text-blue-600 disabled:text-slate-400 hover:text-blue-300 hover:cursor-pointer'>Use email code instead</button>
            </> : screen === 'code' ? <>
                <input key='codeField' value={code} onInput={onChangeCode} alt='code' placeholder='Code' type='text' className='input input-bordered text-center rounded-md text-black dark:text-white' />
                <br />
                <br />
                <button disabled={isLoading} onClick={verifyEmailCode} onSubmit={verifyEmailCode} type='submit' className='btn btn-md h-8 mx-1 rounded-md bg-blue-600 text-white hover:bg-blue-500'>{isLoading ? <UilSpinner className='inline-block animate-spin h-5' /> : 'Next'}</button>
                <button onClick={resetLogin} type='button' className='btn btn-md h-8 mx-1 rounded-md bg-gray-500 text-white hover:bg-gray-400'>Cancel</button>
            </> : null}
            {error ? <><br /><br /><div className='bg-red-200 p-2 w-full'>{error}</div></> : null}
        </form>
    </div >;
};

export default LoginSecKey;
