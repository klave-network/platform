import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UilGithub, UilGitlab, UilSpinner } from '@iconscout/react-unicons';
import qs from 'query-string';
import api from '../../../utils/api';
import Login from '../../login';

export const Index: FC = () => {

    const navigate = useNavigate();
    const { postConnect } = qs.parse(window.location.search);
    const [isPostConnect] = useState<boolean>(postConnect === 'true');
    const [needsGHToken, setNeedsGHToken] = useState(true);
    const [hasRedirected, setHasRedirected] = useState(false);
    const { data: sessionData } = api.v0.auth.getSession.useQuery();
    const { data: forkingData, mutate, error: forkingError } = api.v0.repos.forking.useMutation();

    useEffect(() => {
        if (sessionData?.me && isPostConnect)
            setNeedsGHToken(false);
    }, [sessionData]);

    useEffect(() => {
        if (!hasRedirected && !needsGHToken) {
            setHasRedirected(true);
            const [owner, repo] = window.location.pathname.split('/template/github')[1]?.split('/')?.slice(-2) ?? [];
            if (owner && repo) {
                mutate({
                    owner,
                    name: repo
                });
            }
            else
                console.error('No owner or repo');
        }
    }, [hasRedirected, navigate, needsGHToken]);

    useEffect(() => {
        if (forkingData) {
            navigate(`/deploy/repo/${forkingData.fullName}`);
        }
    }, [forkingData, navigate]);

    useEffect(() => {
        if (forkingError?.message === 'Credentials refresh required')
            setHasRedirected(false);
    }, [forkingError]);

    if (!sessionData?.me)
        return <div className="w-full flex flex-col min-h-screen overflow-hidden dark:bg-gray-900 dark:text-white">
            <main className="flex flex-grow pt-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <Login />
                </div>
            </main>
        </div>;

    const state = JSON.stringify({
        referer: window.location.origin,
        source: 'github',
        redirectUri: `${window.location.pathname}?postConnect=true`
    });

    const githubAuth = new URL('https://github.com/login/oauth/authorize');
    githubAuth.searchParams.append('client_id', 'Iv1.6ff39dee83590f91');
    githubAuth.searchParams.append('scope', 'read:user,read:gpg_key,read:public_key,repo,metadata:read,administration:write,contents:read');
    githubAuth.searchParams.append('state', state);
    githubAuth.searchParams.append('redirect_uri', encodeURI(window.klaveFrontConfig.KLAVE_AUTH__));

    const gitlabAuth = new URL('https://gitlab.com/oauth/authorize');
    gitlabAuth.searchParams.append('client_id', 'Iv1.6ff39dee83590f91');
    gitlabAuth.searchParams.append('response_type', 'code');
    gitlabAuth.searchParams.append('scope', 'read:user,read:gpg_key,read:public_key,repo,metadata:read,administration:write,contents:read');
    gitlabAuth.searchParams.append('state', state);
    gitlabAuth.searchParams.append('redirect_uri', encodeURI(window.klaveFrontConfig.KLAVE_AUTH__));

    const githubAppInstall = new URL('https://github.com/apps/klave-network/installations/new');
    githubAppInstall.searchParams.append('state', state);

    if (forkingError) {
        return <div className="w-full flex flex-col min-h-screen overflow-hidden dark:bg-gray-900 dark:text-white">
            <main className="flex flex-grow pt-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="pt-12 pb-12 md:pt-20 md:pb-20">
                        <div className="text-center pb-12 md:pb-16">
                            <div className='pb-5' >
                                <h1 className='text-xl font-bold'>We're sorry, something went wrong</h1>
                            </div>
                            <div className='relative'>
                                We were unable to create a new repository in your GitHub account.<br />
                                Kalve needs to be installed in your GitHub account to proceed.<br />
                                Make sure you have installed Klave on your GitHub account and try again.<br /><br />
                                <a href={githubAppInstall.toString()} className='btn btn-sm bg-blue-600 text-white hover:bg-blue-500 rounded-md disabled:text-gray-300'>Install Klave now</a><br /><br /><br />
                                Other you may attemp at a later time.
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>;
    }

    if (needsGHToken)
        return <div className="w-full flex flex-col min-h-screen overflow-hidden dark:bg-gray-900 dark:text-white">
            <main className="flex flex-grow pt-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="pt-12 pb-12 md:pt-20 md:pb-20">
                        <div className="text-center pb-12 md:pb-16">

                            <div className='pb-5'>
                                <h1 className='text-xl font-bold'>Lets connect you to GitHub</h1>
                                <p>To deploy a new Project, we will create a new repository for you</p>
                            </div>
                            <div className='relative h-[300px]'>
                                <a href={githubAuth.toString()} className='btn btn-sm mb-3 rounded-full bg-black hover:bg-gray-900 text-white'><UilGithub color='white' />&nbsp;Connect to GitHub</a><br />
                                <a href={gitlabAuth.toString()} className='btn btn-sm rounded-full bg-[#db7130] hover:bg-[#bb472d] text-white hidden'><UilGitlab color='white' />&nbsp;Connect to GitLab</a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>;

    return <div className="w-full flex flex-col min-h-screen overflow-hidden dark:bg-gray-900 dark:text-white">
        <main className="flex flex-grow pt-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="pt-12 pb-12 md:pt-20 md:pb-20">
                    <div className="text-center pb-12 md:pb-16">
                        <div className='pb-5' >
                            <h1 className='text-xl font-bold'>We're getting things ready for you...</h1>
                        </div>
                        <div className='relative'>
                            We are creating a new repository in your GitHub account.<br />
                            We will populate it with your app shortly.<br />
                            It will only take a moment...
                            <br />
                            <br />
                            <UilSpinner className='inline-block animate-spin h-5' />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>;
};

export default Index;