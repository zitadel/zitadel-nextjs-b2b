const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ['Lato', 'Arial', 'sans-serif'],
      ailerons: ['ailerons', 'sans-serif'],
    },
    backdropFilter: {
      none: 'none',
      nav: 'saturate(110%) blur(5px)',
    },
    boxShadow: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      none: 'none',
      lnav: 'inset 0 -1px #e3e8ee',
      dnav: 'inset 0 -1px #303031',
    },
    extend: {
      rotate: {
        5: '5deg',
        '-5': '-5deg',
      },
      spacing: {
        '32px': '32px',
      },
      colors: {
        'footer-light': '#f4f4f4',
        'footer-dark': '#333',
        'light-gray': '#fafafa',
        lnav: 'hsla(0,0%,100%,.8)',
        dnav: '#1f293780',
        consolemock: 'rgb(50, 15, 30)',
        loginmock: '#212224',
        mainred: '#cd5c5c',
        lightred: '#f7acac',
        darkmainred: '#cd5c5c80',
        darklightred: '#f7acac',
        darkergreen: 'rgb(110, 189, 125)',
        lightergreen: 'rgb(188, 228, 157)',
        darkergreentransparent: 'rgba(110, 189, 125, .8)',
        lightergreentransparent: 'rgba(188, 228, 157, .8)',
        darkblue: '#32325d',
        zitadelblue: {
          50: '#e3e3e7',
          100: '#b9b9c2',
          200: '#8a8b9a',
          300: '#5b5d72',
          400: '#373a53',
          500: '#141735',
          600: '#121430',
          700: '#0e1128',
          800: '#141735',
          900: '#121430',
        },
        zitadelaccent: {
          200: '#9dc6ff',
          300: '#559dff',
          400: '#378cff',
          500: '#187aff',
          600: '#0069f8',
        },
      },
      minWidth: (theme) => ({
        tier: '100px',
        '1/2': '50%',
        80: '20rem',
        260: '260px',
        120: '30rem',
        150: '35rem',
        half: '50%',
        40: '10rem',
      }),
      minHeight: (theme) => ({
        96: '24rem',
        12: '3rem',
        120: '30rem',
        150: '35rem',
      }),
      width: (theme) => ({
        120: '30rem',
        150: '35rem',
      }),
      height: (theme) => ({
        50: '12.5rem',
        100: '25rem',
        120: '30rem',
        150: '35rem',
        180: '40rem',
      }),
      maxHeight: {
        screenmnav: 'calc(100vh - 100px)',
        500: '500px',
      },
      animation: {
        waves: 'waves 4s ease-in-out 0s infinite normal none running',
      },
      keyframes: {
        waves: {
          '0%': {
            transform: 'translateZ(0);',
          },
          '65%': {
            transform: 'translate3d(-5px, 15px, 0)',
          },
          '100%': {
            transform: 'translateZ(0)',
          },
        },
      },
    },
  },
  variants: {
    extend: {
      display: ['dark'],
      grayscale: ['hover', 'focus'],
      position: ['responsive'],
      backgroundColor: ['responsive', 'hover', 'focus', 'active', 'disabled'],
      // ring: ['hover', 'focus']
    },
  },
  plugins: [require('tailwindcss-filters')],
};
