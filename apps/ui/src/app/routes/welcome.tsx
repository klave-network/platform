import { Link } from 'react-router-dom';
import { RocketIcon, Pencil2Icon, ExternalLinkIcon } from '@radix-ui/react-icons';
import Expl_1 from '../images/example_thumb/expl_1.svg';
import Expl_2 from '../images/example_thumb/expl_2.svg';
import Expl_3 from '../images/example_thumb/expl_3.svg';
import Expl_4 from '../images/example_thumb/expl_4.svg';

function Welcome() {
    return <>
        <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                <div className="font-medium flex items-center text-3xl text-gray-900 dark:text-white">
                    Ready to go
                </div>
            </div>
        </div>
        <div className='mx-auto text-center prose block max-w-none w-2/3 p-8'>
            <div className='mx-auto w-2/3'>
                <RocketIcon className='w-24 h-24 mb-5 border border-gray-200 p-5 rounded-2xl border-slate-150 mx-auto bg-slate-50 text-slate-500' />
                Get started with Klave by creating a new application in a GitHub repository and connecting it to Klave.<br />
                If you would like, you can start with a template from our marketplace: <br />
                <h2 className='mt-5'>Start from template</h2>
                <a rel="noopener" className='btn my-8 w-auto h-auto py-6 not-prose' href='https://klave.com/marketplace' target='_blank'>
                    <div className='grid grid-flow-row grid-cols-2 gap-2'>
                        <img alt='E1' title='E1' className='bg-slate-950 m-0 p-0 rounded-md w-32 h-24' src={Expl_1} />
                        <img alt='E2' title='E2' className='bg-slate-950 m-0 p-0 rounded-md w-32 h-24' src={Expl_2} />
                        <img alt='E3' title='E3' className='bg-slate-950 m-0 p-0 rounded-md w-32 h-24' src={Expl_3} />
                        <img alt='E4' title='E4' className='bg-slate-950 m-0 p-0 rounded-md w-32 h-24' src={Expl_4} />
                        <div className='p-3 pb-0 col-span-2 inline-block'> https://klave.com/marketplace <ExternalLinkIcon className='inline' /></div>
                    </div>
                </a><br /><br /><br />
            </div>
            <Pencil2Icon className='w-24 h-24 mb-5 border border-gray-200 p-5 rounded-2xl border-slate-150 mx-auto bg-slate-50 text-slate-500' />
            Or you can create a new application from scratch by following the steps below:<br /><br />
            <span className='inline-block h-8 w-8 -ml-1 mt-3 mb-3 border rounded-full font-bold text-center'>1</span>
            <h2 className='mt-0'>Check you have Node installed</h2>
            You will need Node version 20 or greater for the best experience.<br />
            Get info on how to install Node at <a rel="noopener" href='https://nodejs.org' target='_blank'>https://nodejs.org</a><br />
            <pre className='text-left'>
                &gt; node -v<br />
                v20.9.0
            </pre>
            <span className='inline-block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>2</span>
            <h2 className='mt-0'>Scaffold your Klave application</h2>
            <pre className='text-left'>
                &gt; yarn create on-klave<br />
                yarn create v1.22.21<br />
                [1/4] Resolving packages...<br />
                [2/4] Fetching packages...<br />
                [3/4] Linking dependencies...<br />
                [4/4] Building fresh packages...<br />
                <br />
                success Installed "create-on-klave@0.3.19" with binaries:<br />
                - create-on-klave<br />
                - create-trustless-app<br />
                √ What is the npm package name? ... my-trustless-app<br />
                √ What is the name of your trustless application? ... My trustless application<br />
                √ How would you describe the trustless application? ... This is a trustless application for the Klave Network<br />
                √ What is the name of the author? ... John Doe<br />
                √ What is the email address of the author? ... me@example.com<br />
                √ What is the URL to the author's GitHub profile? ...<br />

            </pre>
            <span className='inline-block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>3</span>
            <h2 className='mt-0'>Move to the application directory and get your code ready</h2>
            Check out Klave documentation to know more about the available APIs.<br />
            <a rel="noopener" href='https://klave.com/docs' target='_blank'>https://klave.com/docs</a>
            <br />
            <span className='inline-block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>4</span>
            <h2 className='mt-0'>Push your application repository on Github</h2>
            <pre className='text-left'>
                &gt; gh repo create<br />
                &gt; git add .<br />
                &gt; git commit -m "your commit message"<br />
                &gt; git push --set-upstream origin master<br />
            </pre>
            <span className='inline-block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>5</span>
            <h2 className='mt-0'>Click on <Link to="/deploy" className="btn btn-md h-8 text-white dark:text-black dark:bg-gradient-to-r dark:from-klave-cyan dark:to-klave-light-blue bg-black dark:hover:bg-gradient-to-l hover:bg-gray-800 ml-3">
                <span>Deploy now</span>
            </Link></h2>
        </div>
    </>;
}

export default Welcome;