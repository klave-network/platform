const { join } = require('path');

const TailwindAnimate = require('tailwindcss-animate');
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');

module.exports = {
    content: [
        // relative path by consumer app
        // './{src,pages,components,app}/**/*.{ts,tsx,html}',
        // join(__dirname, '../../../../apps/ui/src/**/*.{js,jsx,ts,tsx,html}'),
        // path to ui-kit components (relative to current dir)
        join(__dirname, '../components/**/*.{ts,tsx}'),
        ...createGlobPatternsForDependencies(__dirname)
    ],
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
                'klave-purple': '#B291ED',
                'border': 'hsl(var(--border))',
                'input': 'hsl(var(--input))',
                'ring': 'hsl(var(--ring))',
                'background': 'hsl(var(--background))',
                'foreground': 'hsl(var(--foreground))',
                'primary': {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                'secondary': {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                'destructive': {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                'muted': {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                'accent': {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                'popover': {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                'card': {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                'sidebar': {
                    'DEFAULT': 'hsl(var(--sidebar-background))',
                    'foreground': 'hsl(var(--sidebar-foreground))',
                    'primary': 'hsl(var(--sidebar-primary))',
                    'primary-foreground':
                        'hsl(var(--sidebar-primary-foreground))',
                    'accent': 'hsl(var(--sidebar-accent))',
                    'accent-foreground':
                        'hsl(var(--sidebar-accent-foreground))',
                    'border': 'hsl(var(--sidebar-border))',
                    'ring': 'hsl(var(--sidebar-ring))'
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                'accordion-down': {
                    from: {
                        height: 0
                    },
                    to: {
                        height: 'var(--radix-accordion-content-height)'
                    }
                },
                'accordion-up': {
                    from: {
                        height: 'var(--radix-accordion-content-height)'
                    },
                    to: {
                        height: 0
                    }
                }
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            }
        }
    },
    plugins: [TailwindAnimate]
};
