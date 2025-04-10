import { FC } from 'react';
import { Link } from 'react-router-dom';
import secretariumLogo from '../images/secretarium-gray.svg';
import api from '../utils/api';
// import klaveLogo from '../images/klave-logo.svg';

const Footer: FC = () => {

    const { data: session } = api.v0.auth.getSession.useQuery();
    const { data: versions } = api.v0.system.version.useQuery();

    return (
        <footer>
            <div className="max-w-6xl mx-auto px-4 sm:px-6">

                {/* Top area: Blocks */}
                <div className="grid sm:grid-cols-12 gap-8 py-8 md:py-12 border-t border-gray-200 dark:border-gray-700">

                    {/* 1st block */}
                    <div className="sm:col-span-12 lg:col-span-3">
                        <div className="mb-2">
                            {/* Logo */}
                            {/* <Link to="/" className="inline-block mb-4" aria-label="Secretarium Platform">
                                <img alt='Secretarium' src={klaveLogo} width={40} className='inline-block' />
                            </Link> */}
                            <a href="https://secretarium.com" className="inline-block" aria-label="Secretarium">
                                <img alt='Secretarium' src={secretariumLogo} className="lg:w-2/3 w-40" />
                            </a>
                        </div>
                    </div>

                    {/* 2nd block */}
                    <div className="hidden sm:col-span-5 md:col-span-4 lg:col-span-3">
                        <h6 className="text-gray-800 dark:text-gray-500 font-medium mb-2">Products</h6>
                        <ul className="text-sm">
                            <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition duration-150 ease-in-out">Platform</Link>
                            </li>
                            <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition duration-150 ease-in-out">Connector</Link>
                            </li>
                            <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition duration-150 ease-in-out">Integrations</Link>
                            </li>
                            <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition duration-150 ease-in-out">Command-line</Link>
                            </li>
                        </ul>
                    </div>

                    {/* 3rd block */}
                    <div className="sm:col-span-5 md:col-span-4 lg:col-span-3">
                        <h6 className="text-gray-800 dark:text-gray-500 font-medium mb-2">Resources</h6>
                        <ul className="text-sm">
                            <li className="mb-2">
                                <a href="https://klave.com/docs" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition duration-150 ease-in-out">Documentation</a>
                            </li>
                            {session?.me?.globalAdmin ? <li className="mb-2">
                                <Link to="/system" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition duration-150 ease-in-out">System Management</Link>
                            </li> : null}
                            {/* <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out">Tutorials & Guides</Link>
                            </li>
                            <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out">Blog</Link>
                            </li> */}
                        </ul>
                    </div>

                    {/* 4th block */}
                    <div className="sm:col-span-5 md:col-span-4 lg:col-span-3">
                        <h6 className="text-gray-800 dark:text-gray-500 font-medium mb-2">Company</h6>
                        <ul className="text-sm">
                            <li className="mb-2">
                                <a href="https://secretarium.com" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition duration-150 ease-in-out">Home</a>
                            </li>
                            {/* <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out">About us</Link>
                            </li>
                            <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out">Company values</Link>
                            </li>
                            <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out">Pricing</Link>
                            </li>
                            <li className="mb-2">
                                <Link to="#" className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out">Privacy Policy</Link>
                            </li> */}
                        </ul>
                    </div>

                    {/* 5th block */}
                    {/* <div className="sm:col-span-6 md:col-span-3 lg:col-span-3">
                        <h6 className="text-gray-800 font-medium mb-2">Subscribe</h6>
                        <p className="text-sm text-gray-600 mb-4">Get the latest news and articles to your inbox every month.</p>
                        <form>
                            <div className="flex flex-wrap mb-4">
                                <div className="w-full">
                                    <label className="block text-sm sr-only" htmlFor="newsletter">Email</label>
                                    <div className="relative flex items-center max-w-xs">
                                        <input id="newsletter" type="email" className="input input-bordered form-input w-full text-gray-800 px-3 py-2 pr-12 text-sm" placeholder="Your email" required />
                                        <button type="submit" className="btn btn-sm absolute inset-0 left-auto" aria-label="Subscribe">
                                            <span className="absolute inset-0 right-auto w-px -ml-px my-2 bg-gray-300" aria-hidden="true"></span>
                                            <svg className="w-3 h-3 fill-current text-blue-600 mx-3 flex-shrink-0" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M11.707 5.293L7 .586 5.586 2l3 3H0v2h8.586l-3 3L7 11.414l4.707-4.707a1 1 0 000-1.414z" fillRule="nonzero" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="mt-2 text-green-600 text-sm">Thanks for subscribing!</p>
                                </div>
                            </div>
                        </form>
                    </div> */}

                </div>

                {/* Bottom area */}
                <div className="md:flex md:items-center md:justify-between py-4 md:py-8 border-t border-gray-200 dark:border-gray-700">

                    {/* Social links */}
                    <ul className="flex mb-4 md:order-1 md:ml-4 md:mb-0">
                        <li>
                            <a href="https://twitter.com/klavenetwork" target='_blank' rel="noreferrer noopener" className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300" aria-label="Twitter">
                                <svg className="w-12 h-12 fill-current" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 11.5c-.6.3-1.2.4-1.9.5.7-.4 1.2-1 1.4-1.8-.6.4-1.3.6-2.1.8-.6-.6-1.5-1-2.4-1-1.7 0-3.2 1.5-3.2 3.3 0 .3 0 .5.1.7-2.7-.1-5.2-1.4-6.8-3.4-.3.5-.4 1-.4 1.7 0 1.1.6 2.1 1.5 2.7-.5 0-1-.2-1.5-.4 0 1.6 1.1 2.9 2.6 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.3 3.1 2.3-1.1.9-2.5 1.4-4.1 1.4H8c1.5.9 3.2 1.5 5 1.5 6 0 9.3-5 9.3-9.3v-.4c.7-.5 1.3-1.1 1.7-1.8z" />
                                </svg>
                            </a>
                        </li>
                        <li className="ml-4">
                            <a href="https://github.com/klave-network" target='_blank' rel="noreferrer noopener" className="flex justify-center items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300" aria-label="Github">
                                <svg className="w-12 h-12 fill-current" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
                                </svg>
                            </a>
                        </li>
                    </ul>

                    {/* Copyrights note */}
                    <div className="text-sm text-gray-600 dark:text-gray-500 mr-4">
                        {/* <Link to="#" className="text-gray-600 hover:text-gray-900 hover:underline transition duration-150 ease-in-out">Terms</Link> · <Link to="#" className="text-gray-600 hover:text-gray-900 hover:underline transition duration-150 ease-in-out">Privacy Policy</Link> ·  */}
                        <a className="text-klave-dark-blue dark:text-klave-light-blue hover:underline pr-0" href="https://secretarium.com/">Secretarium</a> © {new Date().getFullYear()} All rights reserved<br />
                        Klave <i title={versions?.git?.branch}>v{versions?.version} ({versions?.git?.commit?.substring(0, 8)}{versions?.git?.dirty ? '*' : ''})</i> - UI <i title={import.meta.env.VITE_REPO_BRANCH}>v{import.meta.env.VITE_REPO_VERSION} ({import.meta.env.VITE_REPO_COMMIT?.substring(0, 8)}{import.meta.env.VITE_REPO_DIRTY ? <i title='Dirty'>*</i> : ''})</i> -
                        Core <i title={versions?.secretarium?.core}>v{versions?.secretarium.core} ({versions?.secretarium.backend?.core_version?.build_number})</i> - WASM <i title={versions?.secretarium?.wasm}>v{versions?.secretarium.wasm} ({versions?.secretarium.backend?.wasm_version?.build_number})</i><br />
                        <span className='text-gray-400 dark:text-gray-300'>Node {window.klaveFrontConfig.KLAVE_UI_NODE__}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
