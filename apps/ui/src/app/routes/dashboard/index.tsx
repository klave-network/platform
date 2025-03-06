import { FC } from 'react';
import { useOutlet } from 'react-router-dom';
import { SidebarProvider } from '@klave/ui-kit/components/ui/sidebar';
import { AppSidebar } from '../../partials/AppSidebar';
// import Footer from '../../partials/Footer';

export const Dashboard: FC = () => {

    const outlet = useOutlet();

    return (
        <SidebarProvider>
            <AppSidebar />
            <div className="flex flex-col w-full">
                <div className="mx-auto flex-grow overflow-y-auto w-full">
                    {outlet}
                </div>
                {/* <Footer /> */}
            </div>
        </SidebarProvider>
    );
};

export default Dashboard;
