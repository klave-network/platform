import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import klaveLogo from '../images/klave-logo.svg';
// import { UilBox } from '@iconscout/react-unicons';

const Header: FC = () => {

    const { pathname } = useLocation();
    const { data } = api.v0.auth.getSession.useQuery();
    const tag = window.localStorage.getItem('emphemeralKlaveTag');

    return (
        <header className="fixed top-0 z-50 w-full items-center border-b bg-background">
            {data?.hasUnclaimedApplications ? <div className='text-white bg-red-500 w-full'>
                <div className="max-w-6xl mx-auto py-3 text-center ">
                    You have deployed a honest app but are not logged in !<br />
                    You must sign in in order to save your work !
                </div>
            </div> : null}
            <div className="flex items-center justify-between h-12 w-full px-4">

                {/* Site branding */}
                <div className="flex-shrink-0 flex mr-4 items-center">
                    {/* Logo */}
                    <Link to={pathname === '/' && (data && (data.hasUnclaimedApplications || data.me)) ? '/home' : '/'} className="block ml-0" aria-label="Klave Platform">
                        <img alt='Klave' src={klaveLogo} width={110} className='h-8 inline-block dark:invert' />
                    </Link>
                </div>

                {/* Site navigation */}
                <nav className="flex">
                    <ul className="flex flex-grow justify-end flex-wrap items-center">
                        {data?.me
                            ? <li>
                                <span className="btn-sm ml-3">Welcome, {data.me.slug.replace('~$~', '')}</span>
                            </li>
                            : null}
                        {/*
                        <li>
                            <Link to="/blocks" className="btn btn-sm text-gray-900 bg-gray-200 hover:bg-gray-300 ml-3">
                                <span><UilBox className='inline-block h-5 font-normal' /> Klave Blocks</span>
                            </Link>
                        </li>
                        */}
                        <li>
                            {data?.me && !pathname.startsWith('/system')
                                ? <Link to="/deploy" className="font-medium btn btn-sm text-white dark:text-black dark:bg-gradient-to-r dark:from-klave-cyan dark:to-klave-light-blue bg-black dark:hover:bg-gradient-to-l hover:bg-gray-800 ml-3">
                                    <span>Deploy now</span>
                                </Link>
                                : null
                                // <Link to="/deploy" className="btn btn-sm text-gray-900 bg-gray-200 hover:bg-gray-300 ml-3">
                                //     <span>Deploy now</span>
                                // </Link>
                            }
                        </li>
                        <li>
                            {data?.me
                                ? <Link to="/logout" className="font-medium btn btn-sm text-black dark:text-white bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-800 ml-3">
                                    <span>Log out</span>
                                </Link>
                                : <Link to="/login" className="btn btn-sm text-gray-200 bg-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 hover:bg-gray-800 ml-3">
                                    <span>{data?.hasUnclaimedApplications ? 'Claim my work' : tag?.length ? 'Log in' : 'Sign in'}</span>
                                    <svg className="w-3 h-3 fill-current text-gray-400 flex-shrink-0 ml-2 -mr-1" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M11.707 5.293L7 .586 5.586 2l3 3H0v2h8.586l-3 3L7 11.414l4.707-4.707a1 1 0 000-1.414z" fillRule="nonzero" />
                                    </svg>
                                </Link>
                            }
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
