import { Link } from 'react-router-dom';

function Welcome() {
    return <>
        <div className="sm:px-7 sm:pt-7 px-4 py-4 flex flex-col w-full border-b border-gray-200 bg-white dark:bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
            <div className="flex w-full items-center">
                <div className="font-medium flex items-center text-3xl text-gray-900 dark:text-white">
                    Ready to go
                </div>
            </div>
        </div>
        <div className='prose block max-w-none w-full p-8'>
            Get started by creating a new application in a GitHub repository and connecting it to Klave.<br /><br />
            <span className='block h-8 w-8 -ml-1 mt-3 mb-3 border rounded-full font-bold text-center'>1</span>
            <h2 className='mt-0'>Check you have Node installed</h2>
            You will need Node version 20 or greater for the best experience.<br />
            Get info on how to install Node at <a href='https://nodejs.org' target='_blank'>https://nodejs.org</a><br />
            <pre>
                &gt; node -v<br />
                v20.9.0
            </pre>
            <span className='block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>2</span>
            <h2 className='mt-0'>Scaffold your Klave application</h2>
            <pre>
                &gt; yarn create on-klave<br />
                yarn create v1.22.21<br />
                [1/4] Resolving packages...<br />
                [2/4] Fetching packages...<br />
                [3/4] Linking dependencies...<br />
                [4/4] Building fresh packages...<br />
                <br />
                success Installed "create-on-klave@0.3.15" with binaries:<br />
                - create-on-klave<br />
                - create-trustless-app<br />
                √ What is the npm package name? ... my-trustless-app<br />
                √ What is the name of your trustless application? ... My trustless application<br />
                √ How would you describe the trustless application? ... This is a trustless application for the Klave Network<br />
                √ What is the name of the author? ... John Doe<br />
                √ What is the email address of the author? ... me@example.com<br />
                √ What is the URL to the author's GitHub profile? ...<br />

            </pre>
            <span className='block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>3</span>
            <h2 className='mt-0'>Move to the application directory and get your code ready</h2>
            Check out Klave documentation to know more about the available APIs.<br />
            <a href='https://klave.com/docs' target='_blank'>https://klave.com/docs</a>
            <span className='block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>4</span>
            <h2 className='mt-0'>Push your application repository on Github</h2>
            <pre>
                &gt; gh repo create<br />
                &gt; git add .<br />
                &gt; git commit -m "your commit message"<br />
                &gt; git push --set-upstream origin master<br />
            </pre>
            <span className='block h-8 w-8 -ml-1 mt-10 mb-3 border rounded-full font-bold text-center'>5</span>
            <h2 className='mt-0'>Click on <Link to="/deploy" className="btn btn-sm text-white dark:text-black dark:bg-gradient-to-r dark:from-klave-cyan dark:to-klave-light-blue bg-black dark:hover:bg-gradient-to-l hover:bg-gray-800 ml-3">
                <span>Deploy now</span>
            </Link></h2>
        </div>
    </>;
}

export default Welcome;