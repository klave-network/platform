import { FC, PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@primer/react';
import { hookApi, apiClientOptions } from './utils/api';

export const Providers: FC<PropsWithChildren> = ({ children }) => {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() => hookApi.createClient(apiClientOptions)
    );
    return <ThemeProvider>
        <hookApi.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </hookApi.Provider>
    </ThemeProvider>;
};

export default Providers;