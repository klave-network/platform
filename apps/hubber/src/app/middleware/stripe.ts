import { RequestHandler } from 'express-serve-static-core';
import { prisma } from '@klave/db';
import Stripe from 'stripe';
import { logger } from '@klave/providers';

export const stripeMiddlware: RequestHandler = (req, __unusedRes, next) => {

    (async () => {

        try {
            const webhookSignature = req.headers['stripe-signature']?.toString();
            const webhookSecret = process.env.KLAVE_STRIPE_SIG_SECRET;

            if (!webhookSignature || !webhookSecret) {
                logger.warn('Stripe webhook signature or secret not found');
                return;
            }

            // We must verife the signature of the Webhook
            // https://stripe.com/docs/webhooks/signatures
            // DO NOT USE THE FOLLOWING COMMENTED LINE CODE
            // let event = req.body as Stripe.Event;

            const event = Stripe.webhooks.constructEvent((req as any).rawBody, webhookSignature, webhookSecret);

            if (event.type === 'checkout.session.completed') {

                const session = event.data.object;
                const creditPurchase = (await prisma.creditPurchase.findMany({
                    where: {
                        checkoutSessionId: session.id,
                        checkoutSessionStatus: {
                            in: ['open', 'pending']
                        }
                    }
                }))?.[0];

                if (!creditPurchase)
                    return;

                const sessionStatus = session.status;
                const paymentStatus = session.payment_status;

                if (sessionStatus === 'complete' && paymentStatus === 'paid') {

                    // We are multiplying by 100_000_000 but `amount_subtotal` is in cents, hence dividing by 100
                    const kreditIncrement = (session.amount_subtotal ?? 0) * 1_000_000;

                    await prisma.$transaction([
                        prisma.organisation.update({
                            where: {
                                id: creditPurchase.organisationId
                            },
                            data: {
                                kredits: {
                                    increment: kreditIncrement
                                }
                            }
                        }),
                        prisma.creditPurchase.update({
                            where: {
                                id: creditPurchase.id
                            },
                            data: {
                                checkoutSessionStatus: sessionStatus,
                                setteled: true
                            }
                        })
                    ]);
                }
            } else if (event.type === 'checkout.session.expired') {

                const session = event.data.object;
                const creditPurchase = (await prisma.creditPurchase.findMany({
                    where: {
                        checkoutSessionId: session.id
                    }
                }))?.[0];

                if (!creditPurchase)
                    return;

                const sessionStatus = session.status;

                await prisma.creditPurchase.update({
                    where: {
                        id: creditPurchase.id
                    },
                    data: {
                        checkoutSessionStatus: sessionStatus ?? 'expired',
                        setteled: false
                    }
                });
            }

        } catch (error: any) {
            logger.error('Stripe webhook failed', error.toString().replaceAll('\n', ' '));
        }

        next();
    })()
        .catch(() => { return; });
};