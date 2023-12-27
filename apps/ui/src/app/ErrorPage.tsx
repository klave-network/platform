import { useRouteError } from 'react-router-dom';
import Header from './partials/Header';
import Footer from './partials/Footer';
import { AppWrapper } from './AppLayout';

export const ErrorPage = () => {
    const error = useRouteError() as Record<string, string> | undefined;
    console.error(error);

    return <div className="flex flex-col min-h-screen overflow-hidden">

        {/*  Site header */}
        <Header />

        {/*  Page content */}
        <main className="flex-grow pt-24">
            <div id="message-page">
                <AppWrapper>
                    <br />
                    <div className='pb-5' >
                        <h1 className='text-xl font-bold'>Oops!</h1>
                    </div>
                    <div className='relative h-[300px]'>
                        <p>Sorry, an unexpected error has occurred.</p>
                        <p>
                            <i>{error?.statusText ?? error?.message ?? 'Unfortunately we have no more information'}</i>
                        </p>
                    </div>
                </AppWrapper>
            </div>
        </main>

        <Footer />
    </div>;
};

export default ErrorPage;