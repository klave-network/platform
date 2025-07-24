import { ComponentProps, FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GitRepoBrowser from '../../components/deploy/GitRepoBrowser';
import type { Router } from '../../utils/api';
import type { inferRouterInputs } from '@trpc/server';

export const DeploySelect: FC = () => {

    const navigate = useNavigate();
    const params = useParams<Pick<inferRouterInputs<Router>['v0']['integrations']['getInstallations'], 'provider'>>();
    const { provider } = params;

    if (!provider) {
        navigate('/deploy');
        return null;
    }
    const handleInvalidTokenException = () => {
        navigate('/deploy');
    };

    const handleRepoSelection: ComponentProps<typeof GitRepoBrowser>['onRepoSelect'] = (repo) => {
        if (!repo) return;
        navigate(`/deploy/${provider}/repo/${repo.ownerLogin}/${repo.name}`, {
            state: {
                repo
            }
        });
    };

    return <div id="deploy-select">
        <div className="flex flex-col max-w-6xl mx-auto px-4 sm:px-6">
            <h1 className="text-2xl font-bold mb-4">Let's get you started</h1>
            <p className="mb-4">Select a repository to deploy</p>
            <div className="p-5 min-w-[600px] bg-slate-100">
                <div className='relative'>
                    <GitRepoBrowser
                        provider={provider}
                        onTokenInvalid={handleInvalidTokenException}
                        onRepoSelect={handleRepoSelection}
                    />
                </div>
            </div>
        </div>
    </div>;
};

export default DeploySelect;