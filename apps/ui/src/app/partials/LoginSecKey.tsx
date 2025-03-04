import { FC, useState, useEffect, useCallback, ChangeEvent, MouseEvent } from 'react';
import { platformAuthenticatorIsAvailable, browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import api from '../utils/api';
import { AlertCircle, Info } from 'lucide-react';
import { UilSpinner } from '@iconscout/react-unicons';
import { useLocalForage } from '../useLocalStorage';
import { useDebounceValue } from 'usehooks-ts';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@klave/ui-kit/components/ui/card';
import { Label } from '@klave/ui-kit/components/ui/label';
import { Input } from '@klave/ui-kit/components/ui/input';
import { Button } from '@klave/ui-kit/components/ui/button';
import {
    Alert,
    AlertDescription,
    AlertTitle
} from '@klave/ui-kit/components/ui/alert';

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
                        setIsRequestingWebauthnInput(true);
                        return startAuthentication(options);
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
                        return startRegistration(options);
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
                    setError('An error occured while trying to register your secure key. Please try again later.');
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

    return (
        <div className="flex flex-col gap-6 w-[320px]">
            <Card className="">
                <CardHeader className="text-center">
                    {isWebauthAvailable && screen === 'start'
                        ? <>
                            <CardTitle className="text-xl">Secure Key</CardTitle>
                            <CardDescription>Connect with your secure key.</CardDescription>
                        </>
                        : <>
                            <CardTitle className="text-xl">Email Code</CardTitle>
                            <CardDescription>Connect via an email code.</CardDescription>
                        </>
                    }
                </CardHeader>
                <CardContent>
                    <form className='relative'>
                        {screen === 'start' ? <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor='emailField'>Email address</Label>
                                <Input
                                    key='emailField'
                                    value={email}
                                    onInput={onChangeEmail}
                                    alt='email'
                                    placeholder='Email address'
                                    type='email'
                                    required
                                />
                            </div>
                            <Button
                                disabled={isLoading || emailHint?.sucess === false}
                                onClick={handleLoginSubmit}
                                onSubmit={handleLoginSubmit}
                                type='submit'
                                className='disabled:bg-slate-300'
                            >
                                {isLoading
                                    ? <UilSpinner className='inline-block animate-spin h-5' />
                                    : isWebauthAvailable
                                        ? 'Log in with secure key'
                                        : 'Log in with email code'}
                            </Button>
                            <Button
                                variant="secondary"
                                disabled={isLoading || emailHint?.sucess === false}
                                onClick={handleLoginCodeSubmit}
                                className='disabled:text-slate-400'
                            >
                                Use email code instead
                            </Button>
                        </div> : screen === 'code' ? <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor='emailField'>Email code</Label>
                                <Input
                                    key='codeField'
                                    value={code}
                                    onInput={onChangeCode}
                                    alt='code'
                                    placeholder='Code'
                                    type='text'
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    onClick={resetLogin}
                                    type='button'
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={isLoading}
                                    onClick={verifyEmailCode}
                                    onSubmit={verifyEmailCode}
                                    type='submit'
                                >
                                    {isLoading ? <UilSpinner className='inline-block animate-spin h-5' /> : 'Next'}
                                </Button>
                            </div>
                        </div> : null}
                    </form>
                </CardContent>
            </Card>
            {emailHintError?.data || emailHint?.sucess === false
                ? <Alert variant="destructive" className="bg-klave-red/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {emailHintError?.message ?? emailHint?.message ?? 'We encountered a problem.'}
                    </AlertDescription>
                </Alert>
                : emailHint?.message
                    ? <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Info</AlertTitle>
                        <AlertDescription>
                            {emailHint?.message}
                        </AlertDescription>
                    </Alert>
                    : isCheckingEmailHint
                        ? <UilSpinner className='mx-auto animate-spin h-1/2 w-1/2' />
                        : null}
            {error && <Alert variant="destructive" className="bg-klave-red/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    {error}
                </AlertDescription>
            </Alert>}
        </div>
    );
};

export default LoginSecKey;
