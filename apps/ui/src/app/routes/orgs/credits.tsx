import { FC, useMemo, useEffect, useState, ChangeEvent } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { UilSpinner, Uil0Plus, UilEdit, UilCheck } from '@iconscout/react-unicons';
import { loadStripe } from '@stripe/stripe-js';
import { Application } from '@klave/db';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import api, { httpApi } from '../../utils/api';
import { useToggle } from 'usehooks-ts';
import CreditDisplay from '../../components/CreditDisplay';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
let stripePromise: ReturnType<typeof loadStripe>;

const initialiseStripe = async () => {
    if (stripePromise === undefined) {
        const stripeKey = await httpApi.v0.system.getStripeKey.query();
        if (!stripeKey)
            throw new Error('Stripe key not found');
        stripePromise = loadStripe(stripeKey);
    }
    return stripePromise;
};

const CheckoutForm = () => {

    const [, setSearchParams] = useSearchParams();
    const { pathname } = useLocation();
    const { data } = api.v0.credits.createCheckoutSession.useQuery({
        pathname
    });

    const sessionId = useMemo(() => data?.id, [data?.id]);
    const clientSecret = useMemo(() => data?.clientSecret, [data?.clientSecret]);

    if (!sessionId || !clientSecret)
        return <UilSpinner className='inline-block animate-spin' />;

    return <EmbeddedCheckoutProvider
        stripe={initialiseStripe()}
        options={{
            clientSecret,
            onComplete: () => {
                setSearchParams({
                    return: 'true',
                    checkoutSessionId: sessionId
                });
            }
        }}
    >
        <EmbeddedCheckout className='p-0' />
    </EmbeddedCheckoutProvider>;
};

const OrganisationAddCredit = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const isReturningFromCheckout = searchParams.get('return') === 'true';
    const isPaymentComplete = searchParams.get('paymentCompleted') === 'true';

    return <AlertDialog.Root>
        <AlertDialog.Trigger asChild onClick={() => {
            setSearchParams();
        }}>
            <button title='Delete' className="btn btn-sm mt-3 h-8 inline-flex items-center justify-center text-slate-500 text-md font-normalmt-auto">
                <Uil0Plus className='inline-block h-4 w-4' /> Add credits
            </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="AlertDialogOverlay" />
            <AlertDialog.Content className="AlertDialogContent overflow-auto w-[calc(412px)]">
                <AlertDialog.Title className="AlertDialogTitle mb-4">Add credit to your organisation</AlertDialog.Title>
                <AlertDialog.Description className="AlertDialogDescription" asChild>
                    <CheckoutForm />
                </AlertDialog.Description>
                <div className='flex gap-6 justify-end mt-5'>
                    <AlertDialog.Cancel asChild>
                        <button className="btn btn-sm ">{isPaymentComplete || isReturningFromCheckout ? 'Done' : 'Cancel'}</button>
                    </AlertDialog.Cancel>
                    {/* <AlertDialog.Action asChild disabled={!canSubmit}>
                        <button disabled={!canSubmit} className={`btn btn-sm  ${canSubmit ? 'bg-red-700' : 'bg-slate-300'} text-white`} onClick={() => deleteOrganisation()}>Yes, delete organisation</button>
                    </AlertDialog.Action> */}
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};

const CreditCellEdit: FC<{
    max: bigint,
    application: Partial<Application>
}> = ({ application, max }) => {

    const { kredits, id } = application;
    const [isEditing, toggleEditing] = useToggle(false);
    const kreditValue = useMemo(() => Number(kredits), [kredits]);
    const [currentValue, setCurrentValue] = useState(kreditValue);
    const { mutateAsync, error, isPending } = api.v0.organisations.allocationCredits.useMutation();
    const orgAPIUtils = api.useUtils().v0.organisations;
    const appAPIUtils = api.useUtils().v0.applications;

    useEffect(() => {
        setCurrentValue(kreditValue);
    }, [kreditValue]);

    if (!id || kredits === undefined)
        return null;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const sanitized = e.currentTarget.value.replace(/[^0-9.-]/g, '');
        if (!Number.isNaN(parseFloat(sanitized)))
            setCurrentValue(parseFloat(sanitized));
    };

    const allocateCredit = () => {
        (async () => {
            await mutateAsync({
                applicationId: id,
                amount: currentValue - Number(kredits)
            });
            await orgAPIUtils.getAll.invalidate();
            await orgAPIUtils.getBySlug.invalidate();
            await appAPIUtils.getAll.invalidate();
            await appAPIUtils.getById.invalidate();
            await appAPIUtils.getBySlug.invalidate();
            await appAPIUtils.getByOrganisation.invalidate();
            toggleEditing();
        })()
            .catch(() => { return; });
    };

    if (isEditing)
        return <div className='flex gap-4 items-center align-middle justify-end grow'>
            <CreditDisplay kredits={currentValue} size='small' justify='end' className='w-30' />
            <div className='leading-snug pt-1'>
                <input type="range" min={0} max={Number(kredits + max)} onChange={handleChange} value={currentValue} className={`range range-xs w-40 ${error ? 'range-error' : 'range-info'}`} /><br />
                <span className='text-xs text-red-700'>{error?.message?.toString() ?? ''} &nbsp;</span>
            </div>
            <button disabled={isPending} onClick={allocateCredit} className='btn btn-sm flex rounded-sm border border-slate-300 bg-slate-100 p-0 h-7 w-7 items-center justify-center hover:bg-slate-200 hover:cursor-pointer'>
                {isPending ? <UilSpinner className='inline-block h-4 w-4 animate-spin' /> : <UilCheck className='h-4 w-4' />}
            </button>
        </div>;

    return <div className='flex gap-4 items-center align-middle justify-end grow'>
        <CreditDisplay kredits={kreditValue} size='small' justify='end' className='w-30' />
        <button disabled={isPending} onClick={toggleEditing} className='btn btn-sm flex rounded-sm border border-slate-300 bg-slate-100 p-0 h-7 w-7 items-center justify-center hover:bg-slate-200 hover:cursor-pointer'>
            <UilEdit className='h-4 w-4' />
        </button>
    </div>;
};

export const OrganisationSettings: FC = () => {

    const { orgSlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const isReturningFromCheckout = searchParams.get('return') === 'true';
    const checkoutSessionId = searchParams.get('checkoutSessionId') ?? '';
    const { data: checkoutSessionStatus } = api.v0.credits.sessionStatus.useQuery({ checkoutSessionId }, {
        refetchInterval: 1000,
        enabled: isReturningFromCheckout
    });
    const { data: organisation, isLoading, refetch: refetchOrganisation } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug || '' });
    const { data: applicationsList, isLoading: isLoadingApps } = api.v0.applications.getByOrganisation.useQuery({ orgSlug: orgSlug || '' });
    const sortedApplications = useMemo(() => (applicationsList ?? []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [applicationsList]);

    useEffect(() => {
        if (isReturningFromCheckout && checkoutSessionStatus?.status === 'complete') {
            setSearchParams({
                paymentCompleted: 'true'
            });
            refetchOrganisation()
                .catch(() => { return; });
        }
    }, [isReturningFromCheckout, checkoutSessionStatus]);

    if (isLoading || !organisation)
        return <>
            We are fetching data about your organisation.<br />
            It will only take a moment...<br />
            <br />
            <UilSpinner className='inline-block animate-spin' />
        </>;

    return <div className="flex flex-col gap-10 w-full justify-start mb-7">
        <div>
            <h1 className='font-bold text-xl mb-5'>Total Balance</h1>
            <p>
                Balance: <b><CreditDisplay kredits={organisation.kredits} /></b><br />
                {isReturningFromCheckout
                    ? <>
                        <span className='text-green-700'>Thank you for your purchase! We are updating your balance...</span>
                        <UilSpinner className='inline-block animate-spin h-full' /><br />
                    </>
                    : null}
                <OrganisationAddCredit />
            </p>
        </div>
        <div>
            <h1 className='font-bold text-xl mb-5'>Application allocations</h1>
            {isLoadingApps
                ? <><UilSpinner className='inline-block animate-spin' /></>
                : <table className='w-full' cellPadding={10}>
                    <thead className='bg-slate-100 border-slate-100 border rounded-sm p-2'>
                        <tr>
                            <th className='text-left'>
                                Application
                            </th>
                            <th className='text-right items-end'>
                                Balance
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedApplications?.map((application, i) =>
                            <tr key={i} className='border-slate-100 border border-t-0 rounded-sm p-2'>
                                <td>
                                    <Link to={`/${orgSlug}/${application.slug}`} className='font-bold hover:cursor-pointer hover:text-klave-light-blue'>{application?.slug}</Link>
                                    <p>{application.slug}</p>
                                </td>
                                <td>
                                    <CreditCellEdit key={application.id} max={organisation.kredits} application={application} />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>}
        </div>
    </div>;
};

export default OrganisationSettings;