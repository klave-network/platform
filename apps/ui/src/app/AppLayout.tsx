import { FC, PropsWithChildren } from 'react';
import { useOutlet } from 'react-router-dom';

export const AppWrapper: FC<PropsWithChildren> = ({ children }) => {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-12 pb-12 md:pt-20 md:pb-20">
            <div className="text-center pb-12 md:pb-16">
                {children}
            </div>
        </div>
    </div>;
};

export const AppLayout = () => {
    const outlet = useOutlet();

    return <AppWrapper>{outlet}</AppWrapper>;
};

export default AppLayout;