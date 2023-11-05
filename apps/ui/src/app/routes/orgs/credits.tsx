import { FC, useMemo, useEffect } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { UilSpinner, Uil0Plus } from '@iconscout/react-unicons';
import { loadStripe } from "@stripe/stripe-js";
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';
import api from '../../utils/api';
// import { useZodForm } from '../../utils/useZodForm';
// import { z } from 'zod';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(import.meta.env['VITE_KLAVE_STRIPE_KEY'] ?? '');

const CheckoutForm = () => {

    const [, setSearchParams] = useSearchParams()
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
                })
            }
        }}
    >
        <EmbeddedCheckout className='p-0' />
    </EmbeddedCheckoutProvider>
}

const OrganisationAddCredit = () => {

    const [searchParams, setSearchParams] = useSearchParams()
    const isReturningFromCheckout = searchParams.get('return') === 'true';
    const isPaymentComplete = searchParams.get('paymentCompleted') === 'true';
    // const navigate = useNavigate();
    // const { orgSlug } = useParams();
    // const [canSubmit, setCanSubmit] = useState(false);
    // const utils = api.useUtils().v0.organisations;
    // const mutation = api.v0.organisations.delete.useMutation({
    //     onSuccess: async () => {
    //         await utils.getAll.invalidate();
    //         await utils.getById.invalidate();
    //         navigate('/app');
    //     }
    // // });
    // const deleteOrganisation = async () => {
    //     // if (orgId)
    //     //     await mutation.mutateAsync({
    //     //         organisationId: orgId
    //     //     });
    // };

    return <AlertDialog.Root>
        <AlertDialog.Trigger asChild onClick={() => {
            setSearchParams()
        }}>
            <button title='Delete' className="mt-3 h-8 inline-flex items-center justify-center text-slate-500 text-md font-normalmt-auto">
                <Uil0Plus className='inline-block h-full' /> Add credits
            </button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="AlertDialogOverlay" />
            <AlertDialog.Content className="AlertDialogContent overflow-auto w-[calc(412px)]">
                <AlertDialog.Title className="AlertDialogTitle mb-4">Add credit to your organisation</AlertDialog.Title>
                <AlertDialog.Description className="AlertDialogDescription">
                    <CheckoutForm />
                </AlertDialog.Description>
                <div style={{ display: 'flex', gap: 25, justifyContent: 'flex-end' }}>
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


export const OrganisationSettings: FC = () => {

    const { orgSlug } = useParams();
    const [searchParams, setSearchParams] = useSearchParams()
    const isReturningFromCheckout = searchParams.get('return') === 'true';
    const checkoutSessionId = searchParams.get('checkoutSessionId') ?? '';
    const { data: checkoutSessionStatus } = api.v0.credits.sessionStatus.useQuery({ checkoutSessionId }, {
        refetchInterval: 1000,
        enabled: isReturningFromCheckout
    });
    const { data: organisation, isLoading, refetch: refetchOrganisation } = api.v0.organisations.getBySlug.useQuery({ orgSlug: orgSlug || '' });
    const { data: applicationsList, isLoading: isLoadingApps } = api.v0.applications.getByOrganisation.useQuery({ orgSlug: orgSlug || '' });
    const sortedApplications = useMemo(() => (applicationsList ?? []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()), [applicationsList])

    // const utils = api.useUtils().v0.organisations;
    // const mutation = api.v0.organisations.update.useMutation({
    //     onSuccess: async () => {
    //         await utils.getBySlug.invalidate();
    //     }
    // });

    // const methods = useZodForm({
    //     schema: z.object({
    //         name: z.string(),
    //         slug: z.string()
    //     }),
    //     values: {
    //         name: organisation?.name || '',
    //         slug: organisation?.slug || ''
    //     }
    // });

    useEffect(() => {
        if (isReturningFromCheckout && checkoutSessionStatus?.status === 'complete') {
            setSearchParams({
                paymentCompleted: 'true'
            })
            refetchOrganisation()
        }
    }, [isReturningFromCheckout, checkoutSessionStatus])

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
                : <><div className='flex flex-row gap-3 bg-slate-100 border-slate-100 border rounded-sm p-2'>
                    <div className='flex flex-col gap-1 grow'>
                        Application
                    </div>
                    <div className='flex flex-col gap-1 items-center'>
                        Balance
                    </div>
                </div>
                    {sortedApplications?.map((application, i) =>
                        <div key={i} className='flex flex-row gap-3 border-slate-100 border border-t-0 rounded-sm p-2'>
                            <div className='flex flex-col gap-1 grow'>
                                <p className='font-bold'>{application?.name}</p>
                                <p>{application.slug}</p>
                            </div>
                            <div className='flex flex-col gap-1 items-center'>
                                <p className='font-bold'>{parseFloat(application.kredits.toString()).toFixed(3)}</p>
                            </div>
                        </div>

                    )}
                </>}
        </div>
    </div>;
};

export default OrganisationSettings;