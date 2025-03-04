const { join } = require('path');
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const twBaseConfig = require('../../libs/ui-kit/src/tailwind/tailwind.config');

/** @type {import('tailwindcss').Config} */
module.exports = {
    ...twBaseConfig,
    content: [
        ...twBaseConfig.content,
        join(__dirname, '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'),
        ...createGlobPatternsForDependencies(__dirname)
    ],
    darkMode: process.env.NODE_ENV === 'development' ? 'media' : 'class',
    important: true,
    theme: {
        extend: {
            ...twBaseConfig.theme?.extend
        }
    },
    daisyui: process.env.NODE_ENV === 'development' ? {
        logs: true,
        themes: true
    } : {
        themes: false,
        darkTheme: 'light'
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms')({
            strategy: 'class'
        }),
        require('daisyui')]
};
