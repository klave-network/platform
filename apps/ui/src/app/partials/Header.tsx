import { useState, useEffect, FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import klaveLogo from '../images/klave-logo.svg';
// import { UilBox } from '@iconscout/react-unicons';

const Header: FC = () => {

    const { pathname } = useLocation();
    const [top, setTop] = useState(true);
    const { data } = api.v0.auth.getSession.useQuery();
    const tag = window.localStorage.getItem('emphemeralKlaveTag');

    // detect whether user has scrolled the page down by 10px
    useEffect(() => {
        const scrollHandler = () => {
            if (window.pageYOffset > 10)
                setTop(false);
            else
                setTop(true);
        };
        window.addEventListener('scroll', scrollHandler);
        return () => window.removeEventListener('scroll', scrollHandler);
    }, [top]);

    return (
        <header className={`fixed w-full z-30 transition duration-300 ease-in-out ${!top && 'bg-white md:bg-white/90 dark:bg-gray-900 md:dark:bg-gray-900/95 backdrop-blur-xs shadow-lg'}`}>
            {data?.hasUnclaimedApplications ? <div className='text-white bg-red-500'>
                <div className="max-w-6xl mx-auto py-3 text-center ">
                    You have deployed a honest app but are not logged in !<br />
                    You must sign in in order to save your work !
                </div>
            </div> : null}
            <div className="px-5 sm:px-6">
                <div className="flex items-center justify-between h-16 md:h-20">

                    {/* Site branding */}
                    <div className="shrink-0 flex mr-4 items-center">
                        {/* Logo */}
                        <Link to={pathname === '/' && (data && (data.hasUnclaimedApplications || data.me)) ? '/home' : '/'} className="block ml-0" aria-label="Klave Platform">
                            <img alt='Klave' src={klaveLogo} width={110} className='h-8 inline-block dark:invert' />
                        </Link>
                    </div>

                    {/* Site navigation */}
                    <nav className="flex flex-grow">
                        <ul className="flex flex-grow justify-end flex-wrap items-center">
                            {data?.me
                                ? <li>
                                    <span className="btn-md h-8 ml-3">Welcome, {data.me.slug.replace('~$~', '')}</span>
                                </li>
                                : null}
                            {/*
                            <li>
                                <Link to="/blocks" className="btn btn-md h-8 text-gray-900 bg-gray-200 hover:bg-gray-300 ml-3">
                                    <span><UilBox className='inline-block h-5 font-normal' /> Klave Blocks</span>
                                </Link>
                            </li>
                            */}
                            <li>
                                {data?.me && !pathname.startsWith('/system')
                                    ? <Link to="/deploy" className="font-medium btn btn-md h-8 text-white dark:text-black dark:bg-gradient-to-r dark:from-klave-cyan dark:to-klave-light-blue bg-black dark:hover:bg-gradient-to-l hover:bg-gray-800 ml-3">
                                        <span>Deploy now</span>
                                    </Link>
                                    : null
                                    // <Link to="/deploy" className="btn btn-md h-8 text-gray-900 bg-gray-200 hover:bg-gray-300 ml-3">
                                    //     <span>Deploy now</span>
                                    // </Link>
                                }
                            </li>
                            <li>
                                {data?.me
                                    ? <Link to="/logout" className="font-medium btn btn-md h-8 text-black dark:text-white bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 ml-3">
                                        <span>Log out</span>
                                    </Link>
                                    : !pathname.startsWith('/login')
                                        ? <Link to="/login" className="btn btn-md h-8 text-gray-200 bg-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-gray-800 ml-3">
                                            <span>{data?.hasUnclaimedApplications ? 'Claim my work' : tag?.length ? 'Log in' : 'Sign in'}</span>
                                            <svg className="w-3 h-3 fill-current text-gray-400 shrink-0 ml-2 -mr-1" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11.707 5.293L7 .586 5.586 2l3 3H0v2h8.586l-3 3L7 11.414l4.707-4.707a1 1 0 000-1.414z" fillRule="nonzero" />
                                            </svg>
                                        </Link>
                                        : null
                                }
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
