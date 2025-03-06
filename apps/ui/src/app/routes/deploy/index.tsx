import { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UilGithub, UilGitlab } from '@iconscout/react-unicons';
import api from '../../utils/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@klave/ui-kit/components/ui/card';
import { Button } from '@klave/ui-kit/components/ui/button';

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
    githubAuth.searchParams.append('scope', 'read:user,read:gpg_key,read:public_key,repo,metadata:read,administration:write,contents:read');
    githubAuth.searchParams.append('state', state);
    githubAuth.searchParams.append('redirect_uri', encodeURI(window.klaveFrontConfig.KLAVE_AUTH__));

    const gitlabAuth = new URL('https://gitlab.com/oauth/authorize');
    gitlabAuth.searchParams.append('client_id', 'Iv1.6ff39dee83590f91');
    gitlabAuth.searchParams.append('response_type', 'code');
    gitlabAuth.searchParams.append('scope', 'read:user,read:gpg_key,read:public_key,repo,metadata:read,administration:write,contents:read');
    gitlabAuth.searchParams.append('state', state);
    gitlabAuth.searchParams.append('redirect_uri', encodeURI(window.klaveFrontConfig.KLAVE_AUTH__));

    return (
        <div className="flex flex-col gap-6 w-[320px]">
            <Card className="">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">
                        Look for your code
                    </CardTitle>
                    <CardDescription>
                        To deploy a new Project, import an existing Git repository.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <Button variant="outline" className="w-full" asChild>
                            <a href={githubAuth.toString()}>
                                <UilGithub color='black' />
                                Connect to GitHub
                            </a>
                        </Button>
                        <Button variant="outline" className="w-full hidden" asChild>
                            <a href={gitlabAuth.toString()}>
                                <UilGitlab color='black' />
                                Connect to GitLab
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Index;
