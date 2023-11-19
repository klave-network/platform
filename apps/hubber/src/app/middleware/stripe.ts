import { RequestHandler } from 'express-serve-static-core';
import { prisma } from '@klave/db';

export const stripeMiddlware: RequestHandler = (req) => {

    (async () => {

        try {
            const event = req.body;

            console.log(event);

            if (event.type === 'checkout.session.completed') {

                const session = event.data.object;
                const creditPurchase = (await prisma.creditPurchase.findMany({
                    where: {
                        checkoutSessionId: session.id
                    }
                }))?.[0];

                if (!creditPurchase)
                    return;

                const sessionStatus = session.status;
                const paymentStatus = session.payment_status;

                if (sessionStatus === 'complete' && paymentStatus === 'paid') {
                    await prisma.$transaction([
                        prisma.organisation.update({
                            where: {
                                id: creditPurchase.organisationId
                            },
                            data: {
                                kredits: {
                                    increment: creditPurchase.kredits
                                }
                            }
                        }),
                        prisma.creditPurchase.update({
                            where: {
                                id: creditPurchase.id
                            },
                            data: {
                                checkoutSessionStatus: sessionStatus,
                                // checkoutSessionPaymentStatus: paymentStatus,
                                setteled: true
                            }
                        })
                    ]);
                }
            }
        } catch (error) {
            console.error(error);
        }
    })()
        .catch(() => { return; });
};