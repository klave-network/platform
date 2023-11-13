import { FC, useMemo, useEffect, useState, ChangeEvent } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { UilSpinner, Uil0Plus, UilEdit, UilCheck } from '@iconscout/react-unicons';
import { loadStripe } from '@stripe/stripe-js';
import { Application } from '@klave/db';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import api from '../../utils/api';
import { useToggle } from 'usehooks-ts';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(import.meta.env['VITE_KLAVE_STRIPE_KEY'] ?? '');

const CheckoutForm = () => {

    const [, setSearchParams] = useSearchParams();
    const { pathname } = useLocation();
    const { data } = api.v0.credits.createCheckoutSession.useQuery({
        pathname,
        quantity: 1
    });

    const sessionId = useMemo(() => data?.id, [data?.id]);
    const clientSecret = useMemo(() => data?.clientSecret, [data?.clientSecret]);

    if (!sessionId || !clientSecret)
        return <UilSpinner className='inline-block animate-spin' />;

    return <EmbeddedCheckoutProvider
        stripe={stripePromise}
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
            <button title='Delete' className="mt-3 h-8 inline-flex items-center justify-center text-slate-500 text-md font-normalmt-auto">
                <Uil0Plus className='inline-block h-full' /> Add credits
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
                        <button className="Button">{isPaymentComplete || isReturningFromCheckout ? 'Done' : 'Cancel'}</button>
                    </AlertDialog.Cancel>
                    {/* <AlertDialog.Action asChild disabled={!canSubmit}>
                        <button disabled={!canSubmit} className={`Button ${canSubmit ? 'bg-red-700' : 'bg-slate-300'} text-white`} onClick={() => deleteOrganisation()}>Yes, delete organisation</button>
                    </AlertDialog.Action> */}
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
    </AlertDialog.Root>;
};

const CreditCellEdit: FC<{
    max: bigint,
    application: Partial<Application>
}> = ({ application }) => {

    const { kredits, id } = application;
    const [isEditing, toggleEditing] = useToggle(false);
    const kreditValue = useMemo(() => kredits ? parseFloat(kredits.toString()) : 0, [kredits]);
    const [currentValue, setCurrentValue] = useState(kreditValue.toFixed(3));
    const { mutateAsync, isPending } = api.v0.organisations.allocationCredits.useMutation();
    const orgAPIUtils = api.useUtils().v0.organisations;
    const appAPIUtils = api.useUtils().v0.applications;

    useEffect(() => {
        setCurrentValue(kreditValue.toFixed(3));
    }, [kreditValue]);

    if (!id || kredits === undefined)
        return null;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const sanitized = e.currentTarget.value.replace(/[^0-9.-]/g, '');
        if (!Number.isNaN(parseFloat(sanitized)))
            setCurrentValue(sanitized);
    };

    const allocateCredit = async () => {
        await mutateAsync({
            applicationId: id,
            amount: parseFloat(currentValue)
        });
        console.log('PLOP');
        await orgAPIUtils.getAll.invalidate();
        await orgAPIUtils.getBySlug.invalidate();
        await appAPIUtils.getAll.invalidate();
        await appAPIUtils.getByOrganisation.invalidate();
        toggleEditing();
    };

    if (isEditing)
        return <div className='flex gap-4 items-center align-middle justify-end grow'>
            <input value={currentValue} onChange={handleChange} className='rounded-sm' />
            <button disabled={isPending} onClick={allocateCredit} className='flex rounded-sm border border-slate-300 bg-slate-100 p-0 h-7 w-7 items-center justify-center hover:bg-slate-200 hover:cursor-pointer'>
                {isPending ? <UilSpinner className='inline-block h-4 animate-spin' /> : <UilCheck className='h-4' />}
            </button>
        </div>;

    return <div className='flex gap-4 items-center align-middle justify-end grow'>
        <span className='block h-5 font-bold'>{kreditValue.toFixed(3)}</span>
        <button disabled={isPending} onClick={toggleEditing} className='flex rounded-sm border border-slate-300 bg-slate-100 p-0 h-7 w-7 items-center justify-center hover:bg-slate-200 hover:cursor-pointer'>
            <UilEdit className='h-4' />
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
            refetchOrganisation();
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
                Balance: <b>{parseFloat(organisation.kredits.toString()).toFixed(3)}</b><br />
                {isReturningFromCheckout
                    ? <>
                        <span className='text-green-700'>Thank you for your purchase! We are updating your balance...</span>
                        <UilSpinner className='inline-block animate-spin h-4' /><br />
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
                            <th className='text-right'>
                                Balance
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedApplications?.map((application, i) =>
                            <tr key={i} className='border-slate-100 border border-t-0 rounded-sm p-2'>
                                <td>
                                    <Link to={`/${orgSlug}/${application.slug}`} className='font-bold hover:cursor-pointer hover:text-klave-light-blue'>{application?.name}</Link>
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