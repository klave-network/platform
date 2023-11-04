import { z } from 'zod';
import Stripe from 'stripe';
import { createTRPCRouter, publicProcedure } from '../trpc';

const stripe = new Stripe(process.env['KLAVE_STRIPE_KEY'] ?? '');

export const creditsRouter = createTRPCRouter({
    createCheckoutSession: publicProcedure
        .input(z.object({
            pathname: z.string(),
            quantity: z.number().int().min(1)
        }))
        .query(async ({ ctx: { prisma }, input: { pathname, quantity } }) => {
            const origin = process.env['KLAVE_WEBAUTHN_ORIGIN'];
            const priceId = process.env['KLAVE_STRIPE_PRICE_ID'];
            if (!origin || !priceId)
                throw new Error('Missing environment variables');
            const returnURL = new URL(`${origin}${pathname}?return=true&checkoutSessionId={CHECKOUT_SESSION_ID}`);
            const session = await stripe.checkout.sessions.create({
                ui_mode: 'embedded',
                line_items: [
                    {
                        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                        price: priceId,
                        quantity
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
                    kredits: quantity,
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
        .query(async ({ input: { checkoutSessionId } }) => {
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
        })
});

export default creditsRouter;