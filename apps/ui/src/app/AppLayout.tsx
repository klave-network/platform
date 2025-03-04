import { FC, PropsWithChildren } from 'react';
import { useOutlet } from 'react-router-dom';

export const AppWrapper: FC<PropsWithChildren> = ({ children }) => {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20">
            {children}
        </div>
    </div>;
};

export const AppLayout = () => {
    const outlet = useOutlet();

    return <AppWrapper>{outlet}</AppWrapper>;
};

export default AppLayout;
