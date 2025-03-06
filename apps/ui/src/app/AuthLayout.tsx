import { FC, PropsWithChildren, Suspense } from 'react';
import { Await, useLoaderData, useOutlet } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { AppWrapper } from './AppLayout';
import Header from './partials/Header';
import Footer from './partials/Footer';
import type { httpApi } from './utils/api';

const MainWrapper: FC<PropsWithChildren> = ({ children }) => {
    return <main className="flex-grow pt-24">
        {children}
    </main>;
};

const ContentWrapper: FC<PropsWithChildren> = ({ children }) => {
    return <MainWrapper>
        <div id="message-page">
            <AppWrapper>
                {children}
            </AppWrapper>
        </div>
    </MainWrapper>;
};

export const AuthLayout = () => {
    const outlet = useOutlet();
    const { userPromise } = useLoaderData() as { userPromise: ReturnType<typeof httpApi.v0.auth.getSession.query> };

    return (
        <Suspense fallback={<div className="flex flex-col min-h-screen overflow-hidden">
            <Header />
            <ContentWrapper>
                <div className='pb-5' >
                    <h1 className='text-xl font-bold'>Loading...</h1>
                </div>
                <div className='relative h-[300px]'>
                    <p>Give us one moment</p>
                </div>
            </ContentWrapper>
            <Footer />
        </div>}>
            <Await
                resolve={userPromise}
                errorElement={<div className="flex flex-col min-h-screen overflow-hidden">
                    <Header />
                    <ContentWrapper>
                        <div className='pb-5' >
                            <h1 className='text-xl font-bold'>Oops!</h1>
                        </div>
                        <div className='relative h-[300px]'>
                            <p>Something went wrong!</p>
                        </div>
                    </ContentWrapper>
                    <Footer />
                </div>
                }
                children={(user: Awaited<typeof userPromise>) =>
                    <AuthProvider userData={user}>
                        <div className="flex flex-col min-h-screen">
                            <Header />
                            <main className="flex flex-grow pt-12">
                                {outlet}
                            </main>
                            <Footer />
                        </div>
                    </AuthProvider>
                }
            />
        </Suspense>
    );
};
