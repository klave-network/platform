import { FC, useState, useEffect } from 'react';
import { LoaderFunction, useLoaderData, useNavigate } from 'react-router-dom';
import qs from 'query-string';
import { httpApi } from '../utils/api';

export const loader: LoaderFunction = async ({ request }) => {
    const { host, search, pathname } = new URL(request.url);
    const { code, state } = qs.parse(search);
    const parsedState: {
        referer: string;
        source: string;
        redirectUri: string;
    } = typeof state === 'string' ? JSON.parse(state) as any : {};

    try {
        const refererUrl = new URL(parsedState.referer);
        if (host !== refererUrl.host) {
            refererUrl.pathname = pathname;
            refererUrl.search = search;
            window.location.replace(refererUrl.toString());
            return null;
        }
        let data = null;
        if (code) {
            data = await httpApi.v0.repos.registerGitHubCredentials.query({
                code: code as string
            });
        }
        return { data, state };
    } catch (e) {
        return null;
    }
};

export const AuthCodeReception: FC = () => {

    const navigate = useNavigate();
    const [hasRedirected, setHasRedirected] = useState(false);
    const { data, state }: { data: any, state: string } = useLoaderData() as any ?? {};
    const { redirectUri }: { redirectUri: string } = state ? (JSON.parse(state) as any) : { redirectUri: '/deploy/select' };

    useEffect(() => {
        if (!hasRedirected && redirectUri && !data?.error) {
            setHasRedirected(true);
            navigate(redirectUri);
        }
    }, [data?.error, hasRedirected, navigate, redirectUri]);

    if (!data || data.error)
        return <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="pt-12 pb-12 md:pt-20 md:pb-20">
                <div className="text-center pb-12 md:pb-16">
                    <br />
                    <div>
                        <h1 className='text-xl font-bold'>We faced a problem</h1>
                    </div>
                    <div>
                        An issue occurred while we attempted to log you into Github
                    </div>
                    <br />
                    {data
                        ? <div className='text-left w-1/2 mx-auto p-5 bg-slate-300' >
                            <pre>{JSON.stringify(data.errorDescription, null, 4)}</pre>
                        </div>
                        : null}
                </div>
            </div>
        </div>;
    return <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-12 pb-12 md:pt-20 md:pb-20">
            <div className="text-center pb-12 md:pb-16">
                <br />
                <div>
                    <h1 className='text-xl font-bold'>Looking for you...</h1>
                </div>
                <div>
                    Please be patient while we are gathering your Git info...
                </div>
            </div>
        </div>
    </div>;
};

export default AuthCodeReception;