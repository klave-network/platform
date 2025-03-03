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
            colors: {
                'klave-dark-blue': '#00021A',
                'klave-light-blue': '#00BFFF',
                'klave-cyan': '#00FFD5',
                'klave-off-black': '#0E1218',
                'klave-dark-grey': '#13161D',
                'klave-mid-grey': '#2F363E',
                'klave-light-grey': '#808080',
                'klave-off-white': '#E5E5E5',
                'klave-red': '#D97873',
                'klave-peach': '#FCA870',
                'klave-purple': '#B291ED'
            },
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
