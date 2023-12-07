import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UilGithub, UilGitlab } from '@iconscout/react-unicons';
import api from '../../utils/api';

export const Index: FC = () => {

    const navigate = useNavigate();
    const [hasRedirected, setHasRedirected] = useState(false);
    const { data: sessionData } = api.v0.auth.getSession.useQuery();

    useEffect(() => {
        if (!hasRedirected && sessionData?.hasGithubToken) {
            setHasRedirected(true);
            navigate('/deploy/select');
        }
    }, [hasRedirected, navigate, sessionData?.hasGithubToken]);

    const state = JSON.stringify({
        referer: window.location.origin,
        source: 'github',
        redirectUri: '/deploy/select'
    });

    const githubAuth = new URL('https://github.com/login/oauth/authorize');
    githubAuth.searchParams.append('client_id', 'Iv1.6ff39dee83590f91');
    githubAuth.searchParams.append('scope', 'read:user,read:gpg_key,read:public_key,repo');
    githubAuth.searchParams.append('state', state);
    githubAuth.searchParams.append('redirect_uri', encodeURI(import.meta.env['VITE_KLAVE_AUTHSTATE_URL'] ?? `${window.location.origin}/auth`));

    const gitlabAuth = new URL('https://gitlab.com/oauth/authorize');
    gitlabAuth.searchParams.append('client_id', 'Iv1.6ff39dee83590f91');
    gitlabAuth.searchParams.append('response_type', 'code');
    gitlabAuth.searchParams.append('scope', 'read:user,read:gpg_key,read:public_key,repo');
    gitlabAuth.searchParams.append('state', state);
    gitlabAuth.searchParams.append('redirect_uri', encodeURI(import.meta.env['VITE_KLAVE_AUTHSTATE_URL'] ?? `${window.location.origin}/auth`));

    return <>
        <div className='pb-5'>
            <h1 className='text-xl font-bold'>Look for your code</h1>
            <p>To deploy a new Project, import an existing Git repository</p>
        </div>
        <div className='relative h-[300px]'>
            <a href={githubAuth.toString()} className='btn btn-sm mb-3 rounded-full bg-black hover:bg-gray-900 text-white'><UilGithub color='white' />&nbsp;Connect to GitHub</a><br />
            <a href={gitlabAuth.toString()} className='btn btn-sm rounded-full bg-[#db7130] hover:bg-[#bb472d] text-white hidden'><UilGitlab color='white' />&nbsp;Connect to GitLab</a>
        </div>
    </>;
};

export default Index;