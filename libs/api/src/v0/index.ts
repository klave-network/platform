import { createTRPCRouter } from '../trpc';
import auth from './auth';
import users from './users';
import repos from './repos';
import credits from './credits';
import integrations from './integrations';
import organisations from './organisations';
import applications from './applications';
import deployments from './deployments';
import clusters from './clusters';
import activities from './activities';
import domains from './domains';
import system from './system';

export const v0Router = createTRPCRouter({
    auth,
    users,
    repos,
    credits,
    integrations,
    organisations,
    applications,
    deployments,
    clusters,
    activities,
    domains,
    system
});

export type V0Router = typeof v0Router;