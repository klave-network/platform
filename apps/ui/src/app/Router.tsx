import { type FC } from 'react';
import { createRoutesFromElements, Route, RouterProvider, defer } from 'react-router-dom';
import { sentryCreateBrowserRouter } from './utils/sentry';
import AuthCodeReception, { loader as authLoader } from './routes/auth';
import SetupCallback, { loader as setupLoader } from './routes/setup';
import ErrorPage from './ErrorPage';
import Landing from './routes/landing';
import Welcome from './routes/welcome';
import { AuthLayout } from './AuthLayout';
import AppLayout from './AppLayout';
import { ProtectedLayout } from './ProtectedLayout';
import Dashboard from './routes/dashboard';
import Login from './routes/login';
import Logout from './routes/logout';
import Deploy from './routes/deploy';
import RepoSelect from './routes/deploy/select';
import RepoSheet from './routes/deploy/repo';
import AppInfo from './routes/apps/index';
import AppActivity from './routes/apps/activity';
import AppDomains from './routes/apps/domains';
import AppDeployments from './routes/apps/deployments';
import AppDeploymentDetail from './routes/apps/deploymentDetail';
import AppSettings from './routes/apps/settings';
import OrgNew from './routes/orgs/new';
import OrgInfo from './routes/orgs/index';
import OrgActivity from './routes/orgs/activity';
import OrgSettings from './routes/orgs/settings';
import OrgCredits from './routes/orgs/credits';
import RedeemCreditCoupon from './routes/redeem/coupon';
import SysDashboard from './routes/system/dashboard';
import SysMonitoring from './routes/system/monitoring';
import SysUsers from './routes/system/users';
import SysApplications from './routes/system/applications';
import SysOrganisations from './routes/system/organisations';
import SysConfiguration from './routes/system/configuration';
import TemplateDeploy from './routes/template/github';
import Providers from './Providers';
import { httpApi } from './utils/api';

const getUserData = async () => httpApi.v0.auth.getSession.query();

const router = sentryCreateBrowserRouter(
    createRoutesFromElements(
        <Route
            element={<AuthLayout />}
            loader={() => defer({ userPromise: getUserData() })}
            errorElement={<ErrorPage />}
        >
            <Route
                element={<AppLayout />}
            >
                <Route
                    path="login"
                    element={<Login />}
                />
                <Route
                    path="logout"
                    element={<Logout />}
                />
                <Route
                    path="deploy"
                >
                    <Route index element={<Deploy />} />
                    <Route
                        path="select"
                        element={<RepoSelect />}
                    />
                    <Route
                        path="repo/:owner/:name"
                        element={<RepoSheet />}
                    />
                </Route>
            </Route>
            <Route
                path="redeem/:code"
                element={<RedeemCreditCoupon />}
            />
            <Route
                path="auth"
                loader={authLoader}
                element={<AuthCodeReception />}
            />
            <Route
                path="setup"
                loader={setupLoader}
                element={<SetupCallback />}
            />
            <Route path='home' element={<Landing />} />
            <Route path="template/github/*" element={<TemplateDeploy />} />
            <Route element={<ProtectedLayout />}>
                <Route path="system/*" element={<SysDashboard />}>
                    <Route path="monitoring" element={<SysMonitoring />} />
                    <Route path="browse/users" element={<SysUsers />} />
                    <Route path="browse/applications" element={<SysApplications />} />
                    <Route path="browse/organisations" element={<SysOrganisations />} />
                    <Route path="browse/configuration" element={<SysConfiguration />} />
                </Route>
                <Route element={<Dashboard />} >
                    <Route index element={<Welcome />} />
                    <Route
                        path="organisation"
                    >
                        <Route index element={<OrgNew />} />
                        <Route path="new" element={<OrgNew />} />
                        <Route
                            path=":orgSlug"
                            element={<OrgInfo />}
                        >
                            <Route index element={<OrgActivity />} />
                            <Route path="credits" element={<OrgCredits />} />
                            <Route path="settings" element={<OrgSettings />} />
                            <Route path="*" element={<OrgActivity />} />
                        </Route>
                    </Route>
                    <Route
                        path=":orgSlug"
                    >
                        <Route index element={<Welcome />} />
                        <Route
                            path=":appSlug"
                            element={<AppInfo />}
                        >
                            <Route index element={<AppActivity />} />
                            <Route path="deployments">
                                <Route path=":deploymentId" element={<AppDeploymentDetail />} />
                                <Route index element={<AppDeployments />} />
                            </Route>
                            <Route path="domains" element={<AppDomains />} />
                            <Route path="settings" element={<AppSettings />} />
                            <Route path="*" element={<AppActivity />} />
                        </Route>
                    </Route>
                </Route>
            </Route>
        </Route >
    )
);

export const Router: FC = () => {
    return (
        <Providers>
            <RouterProvider router={router} />
        </Providers>
    );
};

export default Router;
