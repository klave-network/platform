import { FC, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { validate } from '@ideafast/idgen';
import api from '../../utils/api';

export const RedeemCreditCoupon: FC = () => {

    const navigate = useNavigate();
    const { code } = useParams();
    const [redeemed, setRedeemed] = useState(false);
    const { data: sessionData } = api.v0.auth.getSession.useQuery();
    const { data, mutateAsync, error, isPending } = api.v0.credits.redeem.useMutation();

    useEffect(() => {
        if (!sessionData?.me)
            return;
        if (typeof code === 'string' && !validate(code))
            navigate('/');
    }, [sessionData, code, navigate]);

    const startRedeeming = () => {
        (async () => {
            if (typeof code === 'string' && validate(code))
                await mutateAsync({ code });
            setRedeemed(true);
        })()
            .catch(() => { return; });
    };

    if (!sessionData?.me)
        return <div id="code" className='w-full m-auto'>

            <div className="max-w-6xl mx-auto gap-12 px-4 sm:px-6">
                <div className="p-5 bg-slate-100 dark:bg-gray-800 rounded-md">
                    <div className="text-center pb-12 md:pb-16">
                        <br />
                        <div>
                            <h1 className='text-xl font-bold'>Please login first</h1>
                        </div>
                        <div>
                            Thank you for the interest you are giving to Klave<br />
                            In order to redeem your coupon please login or register first and visit this page again<br />
                        </div>
                        <br />
                        <div className="space-y-2">
                            <div className='flex items-center justify-center gap-4'>
                                <button
                                    type="button"
                                    onClick={() => navigate('/login', {
                                        state: {
                                            from: window.location.pathname
                                        }
                                    })}
                                    className="btn btn-md h-8 border bg-slate-200 hover:bg-slate-300 p-2"
                                >
                                    Go to the login page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>;


    if (redeemed && data?.coupon)
        return <div id="code" className='w-full m-auto'>

            <div className="max-w-6xl mx-auto gap-12 px-4 sm:px-6">
                <div className="p-5 bg-slate-100 dark:bg-gray-800 rounded-md">
                    <div className="text-center pb-12 md:pb-16">
                        <br />
                        <div>
                            <h1 className='text-xl font-bold'>It's all ready</h1>
                        </div>
                        <div>
                            Thank you for the interest you are giving to Klave<br />
                            The code has now been verified and your credits have been applied<br />
                        </div>
                        <br />
                        <div className="space-y-2">
                            <div className='flex flex-row justify-center items-center gap-1'>
                                + {Array.from((data.coupon.kredits).toString() ?? '').map((char, idx) =>
                                    <span key={idx} className='text-2xl font-bold'>{char}</span>
                                )} credits
                            </div>
                            <br />
                            <div className='flex items-center justify-center gap-4'>
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="btn btn-md h-8 border bg-slate-200 hover:bg-slate-300 p-2"
                                >
                                    Go to the dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>;

    return <div id="code" className='w-full m-auto'>

        <div className="max-w-6xl mx-auto gap-12 px-4 sm:px-6">
            <div className="p-5 bg-slate-100 dark:bg-gray-800 rounded-md">
                <div className="text-center pb-12 md:pb-16">
                    <br />
                    <div>
                        <h1 className='text-xl font-bold'>Get a boost on Klave</h1>
                    </div>
                    <div>
                        Thank you for the interest you are giving to Klave<br />
                        To redeem your coupon, simply press the "Redeem" button.<br />
                    </div>
                    <br />
                    <div className="space-y-2">
                        <div className='flex flex-row justify-center gap-3'>
                            {Array.from(code ?? '').map((char, idx) =>
                                <span key={idx} className='text-2xl font-bold'>{char}</span>
                            )}
                        </div>
                        <br />
                        {error && <div className="text-red-500">{error.message}</div>}
                        <div className='flex items-center justify-center gap-4'>
                            <button
                                type="submit"
                                onClick={startRedeeming}
                                disabled={isPending}
                                className="btn btn-md h-8 border text-white bg-blue-500 hover:bg-blue-400 p-2"
                            >
                                {isPending ? 'Redeeming' : 'Redeem'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="btn btn-md h-8 border bg-slate-200 hover:bg-slate-300 p-2"
                            >
                                Skip for now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>;
};

export default RedeemCreditCoupon;