/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './styles/**/*.css',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-reverse': 'float-reverse 8s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
        'line': 'line 3s linear infinite',
        'line-reverse': 'line-reverse 3s linear infinite',
        'particle': 'particle 7s linear infinite',
      },
    },
  },
  plugins: [],
  safelist: [
    'css-test',
    'bg-test',
    'text-test',
    'animate-float',
    'animate-float-reverse',
    'animate-pulse-slow',
    'animate-line',
    'animate-line-reverse',
    'animate-particle',
  ],
}
