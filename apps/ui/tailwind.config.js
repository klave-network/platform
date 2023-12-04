const { join } = require('path');
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        join(
            __dirname,
            '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
        ),
        ...createGlobPatternsForDependencies(__dirname)
    ],
    darkMode: 'media',
    important: true,
    theme: {
        extend: {
            colors: {
                'klave-dark-blue': '#00021A',
                'klave-light-blue': '#00BFFF',
                'klave-cyan': '#00FFD5'
            }
        }
    },
    plugins: [require('@tailwindcss/forms')({
        strategy: 'class'
    }), require('daisyui')]
};
