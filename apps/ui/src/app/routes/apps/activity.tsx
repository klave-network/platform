import { UilSpinner } from '@iconscout/react-unicons';
import { ActivityLog } from '@prisma/client';
import type { DeploymentPullRequestPayload, DeploymentPushPayload } from '@klave/api';
import { FC } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
// import { UilSpinner } from '@iconscout/react-unicons';
// import api from '../../utils/api';

type ActivityRecordProps = {
    activity: ActivityLog
}

export const ActivityRecord: FC<ActivityRecordProps> = ({ activity }) => {
    if (activity.class === 'pullRequestHook') {
        const { pusher, commit, pullRequest } = activity.context.payload as unknown as DeploymentPullRequestPayload;
        if (activity.context.type === 'opened')
            return <span className='h-5 block my-2'>
                <a target='_blank' rel="noreferrer noopener" href={pusher.htmlUrl} className='font-semibold'><img alt={pusher.login} src={pusher.avatarUrl} className='h-full inline-block rounded-full' /> {pusher.login}</a> opened a pull request <a target='_blank' rel="noreferrer noopener" href={pullRequest?.url} className='text-slate-400'>#{pullRequest?.number}</a> <i>({formatTimeAgo(activity.createdAt)})</i>
            </span>;
        if (activity.context.type === 'synchronize')
            return <span className='h-5 block my-2'>
                <a target='_blank' rel="noreferrer noopener" href={pusher.htmlUrl} className='font-semibold'><img alt={pusher.login} src={pusher.avatarUrl} className='h-full inline-block rounded-full' /> {pusher.login}</a> added commit <a target='_blank' rel="noreferrer noopener" href={pullRequest?.url} className="font-mono rounded bg-klave-light-blue text-klave-dark-blue mx-1 px-2 py-1">{commit.after.substring(0, 8)}</a> to pull request <a target='_blank' rel="noreferrer noopener" href={pullRequest?.url} className='text-slate-400'>#{pullRequest?.number}</a> <i>({formatTimeAgo(activity.createdAt)})</i>
            </span>;
    }
    if (activity.class === 'pushHook') {
        const { pusher, commit, repo } = activity.context.payload as unknown as DeploymentPushPayload;
        return <span className='h-5 block my-2'>
            <a target='_blank' rel="noreferrer noopener" href={pusher.htmlUrl} className='font-semibold'><img alt={pusher.login} src={pusher.avatarUrl} className='h-full inline-block rounded-full' /> {pusher.login}</a> pushed commit <a target='_blank' rel="noreferrer noopener" href={repo?.url} className="font-mono rounded bg-klave-light-blue text-klave-dark-blue mx-1 px-2 py-1">{commit.after.substring(0, 8)}</a> to branch <a target='_blank' rel="noreferrer noopener" href={repo?.url} className='text-slate-400'>{commit?.ref?.replace('refs/heads/', '')}</a> <i>({formatTimeAgo(activity.createdAt)})</i>
        </span>;
    }
    return null;
};

export const ActivityRecordListing: FC = () => {

    const { appSlug, orgSlug } = useParams();
    const { data: application } = api.v0.applications.getBySlug.useQuery({ appSlug: appSlug || '', orgSlug: orgSlug || '' });
    const { data: activitiesList, isLoading: isLoadingActivities } = api.v0.activities.getByApplication.useQuery({ appId: application?.id || '' });

    if (isLoadingActivities || !activitiesList)
        return <>
            We are fetching data about your application's activities.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin' />
        </>;

    return <div className="w-full mb-7">
        <div className="hidden w-full items-center mb-7">
            <button className="inline-flex mr-3 items-center h-8 pl-2.5 pr-2 rounded-md shadow text-gray-700 dark:text-gray-400 dark:border-gray-800 border border-gray-200 leading-none py-0">
                <svg viewBox="0 0 24 24" className="w-4 mr-2 text-gray-400 dark:text-gray-600" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Last 30 days
                <svg viewBox="0 0 24 24" className="w-4 ml-1.5 text-gray-400 dark:text-gray-600" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <button className="inline-flex items-center h-8 pl-2.5 pr-2 rounded-md shadow text-gray-700 dark:text-gray-400 dark:border-gray-800 border border-gray-200 leading-none py-0">
                Filter by
                <svg viewBox="0 0 24 24" className="w-4 ml-1.5 text-gray-400 dark:text-gray-600" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
        </div>
        {activitiesList.length === 0 ?
            <div className="w-full text-left">
                No recorded activity
            </div>
            :
            <div className="w-full text-left">
                {activitiesList.map(activity => <ActivityRecord key={activity.id} activity={activity} />)}
            </div>
        }
    </div>;
};

export default ActivityRecordListing;