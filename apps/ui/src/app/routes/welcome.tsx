import { MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { ExternalLinkIcon } from '@radix-ui/react-icons';
import Expl_1 from '../images/example_thumb/expl_1.svg';
import Expl_2 from '../images/example_thumb/expl_2.svg';
import Expl_3 from '../images/example_thumb/expl_3.svg';
import Expl_4 from '../images/example_thumb/expl_4.svg';
import RustLogo from '../images/source_types/rust.svg';
import ASLogo from '../images/source_types/assemblyscript.svg';
import { UilCopy } from '@iconscout/react-unicons';

function Welcome() {

    const copyToClipboard: MouseEventHandler<HTMLSpanElement> = (e) => {
        e.preventDefault();
        const text = e.currentTarget.textContent || '';
        navigator.clipboard.writeText(text)
            .then(() => {
                //
            }).catch(() => {
                //
            });
    };

    return <>
        <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                <div className="font-medium flex items-center text-3xl text-gray-900 dark:text-white">
                    Ready to start
                </div>
            </div>
        </div>
        <div className='mx-auto text-center prose block max-w-none w-2/3 p-8'>
            <div className='mx-auto w-full'>
                <div>Scaffold your application from scratch ...</div>
                <Tabs.Root defaultValue="as" className='flex flex-col w-full border border-gray-200 rounded bg-slate-50 p-4'>
                    <Tabs.List className='flex shrink-0 border-b border-gray-200'>
                        <Tabs.Trigger value="as" className='flex-1 item border-0 border-b-2 border-transparent rounded-none data-[state=active]:border-klave-light-blue shadow-none text-sm font-normal text-gray-600 dark:text-gray-400 hover:text-klave-light-blue data-[state=active]:font-bold data-[state=active]:text-klave-light-blue hover:cursor-pointer hover:bg-slate-100 hover:dark:bg-slate-800'><img title="AssemblyScript" src={ASLogo} className="inline-block mt-3 mb-2 mr-2 w-5 h-5" />AssemblyScript</Tabs.Trigger>
                        <Tabs.Trigger value="rust" className='flex-1 item border-0 border-b-2 border-transparent rounded-none data-[state=active]:border-klave-light-blue shadow-none text-sm font-normal text-gray-600 dark:text-gray-400 hover:text-klave-light-blue data-[state=active]:font-bold data-[state=active]:text-klave-light-blue hover:cursor-pointer hover:bg-slate-100 hover:dark:bg-slate-800'><img title="Rust" src={RustLogo} className="inline-block mt-3 mb-2 mr-2 w-6 h-6" />Rust</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="as">
                        <span className='inline-block h-8 w-8 -ml-1 mt-5 mb-3 border rounded-full font-bold text-center'>1</span>
                        <span className='mt-0 font-bold block'>Check you have Node installed (&ge; v24)</span>
                        Get info on how to install Node at <a rel="noopener" href='https://nodejs.org' target='_blank'>https://nodejs.org</a><br />
                        <pre className='text-left overflow-hidden relative text-slate-500'>
                            &gt;&nbsp;&nbsp;<span className='relative'><span className='text-white before:-mx-2 before:-my-1 before:rounded before:pr-6 before:absolute before:w-[calc(100%+1rem)] before:h-8 hover:before:bg-gray-700 hover:cursor-pointer group' onClick={copyToClipboard}><span className='relative'><UilCopy className='h-4 w-4 mr-2 hidden group-hover:inline-block' />node -v</span></span></span><br />
                            v24.0.2
                        </pre>
                        <span className='inline-block h-8 w-8 -ml-1 mt-3 mb-3 border rounded-full font-bold text-center'>2</span>
                        <span className='mt-0 font-bold block'>Scaffold your Klave application</span>
                        <pre className='text-left overflow-hidden relative text-slate-500'>
                            &gt;&nbsp;&nbsp;<span className='relative'><span className='text-white before:-mx-2 before:-my-1 before:rounded before:pr-6 before:absolute before:w-[calc(100%+1rem)] before:h-8 hover:before:bg-gray-700 hover:cursor-pointer group' onClick={copyToClipboard}><span className='relative'><UilCopy className='h-4 w-4 mr-2 hidden group-hover:inline-block' />npx create-on-klave</span></span></span><br />
                            √ What is the npm package name? ... my-honest-app<br />
                            √ What is the name of your honest application? ... My honest application<br />
                            √ How would you describe the honest application? ... This is a honest application for Klave<br />
                            √ What is the name of the author? ... John Doe<br />
                            √ What is the email address of the author? ... me@example.com<br />
                            √ What is the URL to the author's GitHub profile? ...<br />

                        </pre>
                        <span className='inline-block h-8 w-8 -ml-1 mt-3 mb-3 border rounded-full font-bold text-center'>3</span>
                        <span className='mt-0 font-bold block'>Get your code ready</span>
                        Open your favorite IDE at the newly created folder and check out Klave documentation to know more about the available APIs.<br />
                        <a rel="noopener" href='https://klave.com/docs' target='_blank'>https://klave.com/docs</a>
                        <br />
                        <span className='inline-block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>4</span>
                        <span className='mt-0 font-bold block'>Push your application to Github</span>
                        Push you newly created application repo via <span className='font-mono'>`git`</span> or <a rel='noopener' title='Github CLI' target='_blank' href='https://cli.github.com/'>Github CLI</a><br />
                        <span className='inline-block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>5</span>
                        <span className='mt-0 font-bold block'>Click on <Link to="/deploy" className="btn btn-md h-8 text-white dark:text-black dark:bg-gradient-to-r dark:from-klave-cyan dark:to-klave-light-blue bg-black dark:hover:bg-gradient-to-l hover:bg-gray-800 mx-2">
                            Deploy now
                        </Link> in the upper right corner</span>
                    </Tabs.Content>
                    <Tabs.Content value="rust">
                        <span className='inline-block h-8 w-8 -ml-1 mt-5 mb-3 border rounded-full font-bold text-center'>1</span>
                        <span className='mt-0 font-bold block'>Check you have cargo-generate installed</span>
                        Get info on how to install cargo-generate at <a rel="noopener" href='https://docs.rs/cargo-generate' target='_blank'>https://docs.rs/cargo-generate</a><br />
                        <pre className='text-left overflow-hidden relative text-slate-500'>
                            &gt;&nbsp;&nbsp;<span className='relative'><span className='text-white before:-mx-2 before:-my-1 before:rounded before:pr-6 before:absolute before:w-[calc(100%+1rem)] before:h-8 hover:before:bg-gray-700 hover:cursor-pointer group' onClick={copyToClipboard}><span className='relative'><UilCopy className='h-4 w-4 mr-2 hidden group-hover:inline-block' />cargo -V</span></span></span><br />
                            cargo 1.87.0 (99624be96 2025-05-06)<br />
                            &gt;&nbsp;&nbsp;<span className='relative'><span className='text-white before:-mx-2 before:-my-1 before:rounded before:pr-6 before:absolute before:w-[calc(100%+1rem)] before:h-8 hover:before:bg-gray-700 hover:cursor-pointer group' onClick={copyToClipboard}><span className='relative'><UilCopy className='h-4 w-4 mr-2 hidden group-hover:inline-block' />cargo install cargo-generate</span></span></span><br />
                            Updating crates.io index<br />
                            Downloaded cargo-generate v0.23.3<br />
                            Installed package `cargo-generate v0.23.3` (executable `cargo-generate`)
                        </pre>
                        <span className='inline-block h-8 w-8 -ml-1 mt-3 mb-3 border rounded-full font-bold text-center'>2</span>
                        <span className='mt-0 font-bold block'>Scaffold your Klave application</span>
                        <pre className='text-left overflow-hidden relative text-slate-500'>
                            &gt;&nbsp;&nbsp;<span className='relative'><span className='text-white before:-mx-2 before:-my-1 before:rounded before:pr-6 before:absolute before:w-[calc(100%+1rem)] before:h-8 hover:before:bg-gray-700 hover:cursor-pointer group' onClick={copyToClipboard}><span className='relative'><UilCopy className='h-4 w-4 mr-2 hidden group-hover:inline-block' />cargo generate --git https://github.com/klave-network/rust-template ledger --name your_app_name</span></span></span><br />
                            🔧 Destination: .\your_app_name ...<br />
                            🔧 project-name: your_app_name ...<br />
                            🔧 Generating template ...<br />
                            🔧 Initializing a fresh Git repository<br />
                            ✨ Done! New project created<br />
                        </pre>
                        <span className='inline-block h-8 w-8 -ml-1 mt-3 mb-3 border rounded-full font-bold text-center'>3</span>
                        <span className='mt-0 font-bold block'>Get your code ready</span>
                        Open your favorite IDE at the newly created folder and check out Klave documentation to know more about the available APIs.<br />
                        <a rel="noopener" href='https://klave.com/docs' target='_blank'>https://klave.com/docs</a>
                        <br />
                        <span className='inline-block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>4</span>
                        <span className='mt-0 font-bold block'>Push your application to Github</span>
                        Push you newly created application repo via <span className='font-mono'>`git`</span> or <a rel='noopener' title='Github CLI' target='_blank' href='https://cli.github.com/'>Github CLI</a><br />
                        <span className='inline-block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>5</span>
                        <span className='mt-0 font-bold block'>Click on <Link to="/deploy" className="btn btn-md h-8 text-white dark:text-black dark:bg-gradient-to-r dark:from-klave-cyan dark:to-klave-light-blue bg-black dark:hover:bg-gradient-to-l hover:bg-gray-800 mx-2">
                            Deploy now
                        </Link> in the upper right corner</span>
                    </Tabs.Content>
                </Tabs.Root>
            </div>
            <div className='flex flex-col mt-8'>
                <div>... or start from a template</div>
                <a rel="noopener" className='btn mb-8 w-auto h-auto py-6 not-prose' href='https://klave.com/marketplace' target='_blank'>
                    <div className='grid grid-flow-row grid-cols-2 gap-2'>
                        <img alt='E1' title='E1' className='bg-slate-950 m-0 p-0 rounded-md w-32 h-24' src={Expl_1} />
                        <img alt='E2' title='E2' className='bg-slate-950 m-0 p-0 rounded-md w-32 h-24' src={Expl_2} />
                        <img alt='E3' title='E3' className='bg-slate-950 m-0 p-0 rounded-md w-32 h-24' src={Expl_3} />
                        <img alt='E4' title='E4' className='bg-slate-950 m-0 p-0 rounded-md w-32 h-24' src={Expl_4} />
                        <div className='p-3 pb-0 col-span-2 inline-block'> https://klave.com/marketplace <ExternalLinkIcon className='inline' /></div>
                    </div>
                </a>
            </div>

        </div>
    </>;
}

export default Welcome;