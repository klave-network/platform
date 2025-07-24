import { FC, MouseEventHandler } from 'react';
import { useNavigate } from 'react-router-dom';
import { UilGithub } from '@iconscout/react-unicons';
import { v4 as uuid } from 'uuid';
import api from '../../utils/api';

export const Deploy: FC = () => {

    const navigate = useNavigate();
    const { data: sessionData } = api.v0.auth.getSession.useQuery();

    const state = {
        referer: window.location.origin,
        redirectUri: '/deploy/github/select',
        seed: uuid()
    };

    const generateGithubAuthUrl = async () => {

        // TODO: Generate PKCE values
        // const codeChallenge = await generateCodeChallenge();
        // console.log('codeChallenge', codeChallenge, codeChallenge.length);

        const githubAuth = new URL('https://github.com/login/oauth/authorize');
        githubAuth.searchParams.append('client_id', 'Iv1.6ff39dee83590f91');
        githubAuth.searchParams.append('scope', 'read:user,read:gpg_key,read:public_key,read:org,repo,metadata:read,administration:write,contents:read');
        githubAuth.searchParams.append('state', JSON.stringify(state));
        githubAuth.searchParams.append('prompt', 'only_multiple');
        // githubAuth.searchParams.append('code_challenge', codeChallenge);
        // githubAuth.searchParams.append('code_challenge_method', 'S256');
        githubAuth.searchParams.append('redirect_uri', encodeURI(window.klaveFrontConfig.KLAVE_AUTH__));

        return githubAuth.toString();
    };

    const handleContinuation: MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { provider } = e.currentTarget.dataset;
        if (provider === 'github') {
            if (sessionData?.hasGithubToken)
                return navigate(state.redirectUri);
            else
                generateGithubAuthUrl()
                    .then((url) => window.location.href = url)
                    .catch((error) => {
                        console.error('Error generating GitHub auth URL:', error);
                    });
        }
    };

    return <div id="deploy">
        <div className="flex flex-col max-w-6xl mx-auto px-4 sm:px-6">
            <h1 className="text-2xl font-bold mb-4">Let's get you started</h1>
            <p className="mb-4">Select a Git provider to import an existing project from a Git repository.</p>
            <div className="p-5 min-w-[600px] bg-slate-100">
                <div className='relative'>
                    <button type='button' data-provider="github" className='btn btn-md h-8 rounded-full bg-black hover:bg-gray-900 text-white' onClick={handleContinuation}><UilGithub color='white' className='inline-block h-5' />&nbsp;Continue with GitHub</button><br />
                </div>
            </div>
        </div>
    </div>;
};

// async function generateCodeChallenge() {

//     const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
//     const randomBytes = new Uint8Array(128);

//     window.crypto.getRandomValues(randomBytes);

//     let codeVerifier = '';
//     for (let i = 0; i < randomBytes.length; i++) {
//         codeVerifier += charset[randomBytes[i] ?? 0 % charset.length];
//     }

//     const encoder = new TextEncoder();
//     const data = encoder.encode(codeVerifier);
//     const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     const base64Url = btoa(String.fromCharCode(...hashArray))
//         .replace(/\+/g, '-')
//         .replace(/\//g, '_')
//         .replace(/=+$/, '');
//     if (base64Url.length === 43)
//         return base64Url;
//     else
//         return await generateCodeChallenge();
// }

export default Deploy;