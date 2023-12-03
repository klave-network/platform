import { z } from 'zod';
import Stripe from 'stripe';
import { createTRPCRouter, publicProcedure } from '../trpc';
import idgen from '@ideafast/idgen';

let stripe: Stripe | undefined;

const checkStripeInit = () => {
    if (!stripe)
        stripe = new Stripe(process.env['KLAVE_STRIPE_KEY'] ?? '');
};

export const creditsRouter = createTRPCRouter({
    createCheckoutSession: publicProcedure
        .input(z.object({
            pathname: z.string()
        }))
        .query(async ({ ctx: { prisma, session: { user } }, input: { pathname } }) => {
            if (!user)
                throw new Error('Not logged in');
            const origin = process.env['KLAVE_WEBAUTHN_ORIGIN'];
            const priceId = process.env['KLAVE_STRIPE_PRICE_ID'];
            if (!origin || !priceId)
                throw new Error('Missing environment variables');
            const returnURL = new URL(`${origin}${pathname}?return=true&checkoutSessionId={CHECKOUT_SESSION_ID}`);
            checkStripeInit();
            if (!stripe)
                throw new Error('Stripe not initialized');
            const session = await stripe.checkout.sessions.create({
                ui_mode: 'embedded',
                line_items: [
                    {
                        price: priceId,
                        quantity: 1
                    }
                ],
                mode: 'payment',
                redirect_on_completion: 'if_required',
                return_url: returnURL.toString(),
                automatic_tax: { enabled: true }
            });

            await prisma.creditPurchase.create({
                data: {
                    checkoutSessionId: session.id,
                    checkoutSessionStatus: session.status ?? 'pending',
                    organisation: {
                        connect: {
                            slug: pathname.split('/')[2]
                        }
                    }
                }
            });

            return { id: session.id, clientSecret: session.client_secret };
        }),
    sessionStatus: publicProcedure
        .input(z.object({
            checkoutSessionId: z.string()
        }))
        .query(async ({ ctx: { session: { user } }, input: { checkoutSessionId } }) => {
            if (!user)
                throw new Error('Not logged in');
            const creditPurchase = (await prisma?.creditPurchase.findMany({
                where: {
                    checkoutSessionId
                }
            }))?.[0];

            if (!creditPurchase)
                return;

            return {
                status: creditPurchase.checkoutSessionStatus
            };
        }),
    redeem: publicProcedure
        .input(z.object({
            code: z.string()
        }))
        .mutation(async ({ ctx: { prisma, session: { user } }, input: { code } }) => {

            if (!user)
                throw new Error('Not logged in');
            if (!idgen.validate(code))
                throw new Error('Invalid code');

            const creditCoupon = (await prisma?.coupon.findMany({
                where: {
                    code,
                    used: false
                }
            }))?.[0];

            if (!creditCoupon)
                throw new Error('Invalid code');

            const organisation = await prisma?.organisation.findUnique({
                where: {
                    id: user.personalOrganisationId
                }
            });

            if (!organisation)
                throw new Error('Invalid organisation');

            await prisma.$transaction([
                prisma.organisation.update({
                    where: {
                        id: organisation.id
                    },
                    data: {
                        kredits: {
                            increment: creditCoupon.kredits
                        }
                    }
                }),
                prisma.coupon.update({
                    where: {
                        id: creditCoupon.id
                    },
                    data: {
                        used: true,
                        userId: user.id
                    }
                })
            ]);

            return {
                coupon: creditCoupon,
                organisation
            };
        })
});

export default creditsRouter;