import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { Router } from '@klave/api';
import superjson from 'superjson';
import { v4 as uuid } from 'uuid';

const emphemeralKlaveTag = window.localStorage.getItem('emphemeralKlaveTag');
if (!emphemeralKlaveTag)
    window.localStorage.setItem('emphemeralKlaveTag', uuid());

export const apiClientOptions = {
    // TODO: To be replaced by import from `@klave/api`
    links: [
        httpBatchLink({
            url: `${window.klaveFrontConfig.KLAVE_API__}/trpc`,
            transformer: superjson,
            fetch: async (url, options) => {
                return fetch(url, {
                    ...options,
                    credentials: 'include'
                });
            },
            headers() {
                return {
                    'x-trustless-klave-ephemeral-tag': window.localStorage.getItem('emphemeralKlaveTag') ?? undefined
                };
            }
        })
    ]
};

export const hookApi = createTRPCReact<Router>();
export const httpApi = createTRPCClient<Router>(apiClientOptions);
export default hookApi;