import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { Router } from '@klave/api';
import superjson from 'superjson';
import { v4 as uuid } from 'uuid';

const emphemeralKlaveTag = window.localStorage.getItem('emphemeralKlaveTag');
if (!emphemeralKlaveTag)
    window.localStorage.setItem('emphemeralKlaveTag', uuid());

export const apiClientOptions = {
    // TODO: To be replaced by import from `@klave/api`
    transformer: superjson,
    links: [
        httpBatchLink({
            url: `${import.meta.env['VITE_KLAVE_API_URL']}/trpc`,
            headers() {
                return {
                    'x-trustless-klave-ephemeral-tag': window.localStorage.getItem('emphemeralKlaveTag') ?? undefined
                };
            }
        })
    ]
};

export const hookApi = createTRPCReact<Router>();
export const httpApi = createTRPCProxyClient<Router>(apiClientOptions);
export default hookApi;