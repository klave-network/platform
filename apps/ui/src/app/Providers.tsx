import { FC, PropsWithChildren, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@primer/react';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { hookApi, apiClientOptions } from './utils/api';

export const Providers: FC<PropsWithChildren> = ({ children }) => {

    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() => hookApi.createClient(apiClientOptions));

    return <StyleSheetManager shouldForwardProp={shouldForwardProp}>
        <ThemeProvider>
            <hookApi.Provider client={trpcClient} queryClient={queryClient}>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </hookApi.Provider>
        </ThemeProvider>
    </StyleSheetManager>;
};

// TODO Remove this when Github Primer supports transient props
// This implements the default behavior from styled-components v5
// See https://styled-components.com/docs/faqs#shouldforwardprop-is-no-longer-provided-by-default
function shouldForwardProp(propName: string, target: unknown) {
    if (typeof target === 'string') {
        return isPropValid(propName);
    }
    return true;
}

export default Providers;