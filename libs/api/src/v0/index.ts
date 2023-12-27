import { createTRPCRouter } from '../trpc';
import auth from './auth';
import repos from './repos';
import credits from './credits';
import organisations from './organisations';
import applications from './applications';
import deployments from './deployments';
import activities from './activities';
import domains from './domains';
import system from './system';

export const v0Router = createTRPCRouter({
    auth,
    repos,
    credits,
    organisations,
    applications,
    deployments,
    activities,
    domains,
    system
});

export type V0Router = typeof v0Router;