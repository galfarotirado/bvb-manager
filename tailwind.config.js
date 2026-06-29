/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bvb: {
          yellow:        '#FFE500',
          'yellow-dim':  '#C4B000',
          black:         '#080808',
          dark:          '#111111',
          card:          '#161616',
          'card-hover':  '#1e1e1e',
          border:        '#242424',
          'border-bright':'#333333',
          muted:         '#777777',
          'muted-bright':'#aaaaaa',
        }
      },
      fontFamily: {
        display: ['Impact', 'Arial Black', 'sans-serif'],
      },
      animation: {
        /* entrance */
        'slide-up':      'slide-up 0.28s cubic-bezier(.22,.68,0,1.2) both',
        'slide-left':    'slide-in-left 0.28s cubic-bezier(.22,.68,0,1.2) both',
        'slide-right':   'slide-in-right 0.28s cubic-bezier(.22,.68,0,1.2) both',
        'fade-in':       'fade-in 0.3s ease-out both',
        'scale-in':      'scale-in 0.25s cubic-bezier(.22,.68,0,1.2) both',
        /* ambient */
        'glow-pulse':    'glow-pulse 2.5s ease-in-out infinite',
        'border-glow':   'border-glow 2.5s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'shimmer':       'shimmer 2.5s linear infinite',
        'stripe-march':  'stripe-march 1.2s linear infinite',
        'flicker':       'flicker 3s linear infinite',
      },
      keyframes: {
        'slide-up':       { from: { opacity:0, transform:'translateY(18px)' }, to: { opacity:1, transform:'translateY(0)' } },
        'slide-in-left':  { from: { opacity:0, transform:'translateX(-20px)' }, to: { opacity:1, transform:'translateX(0)' } },
        'slide-in-right': { from: { opacity:0, transform:'translateX(20px)' }, to: { opacity:1, transform:'translateX(0)' } },
        'fade-in':        { from: { opacity:0 }, to: { opacity:1 } },
        'scale-in':       { from: { opacity:0, transform:'scale(0.92)' }, to: { opacity:1, transform:'scale(1)' } },
        'glow-pulse': {
          '0%,100%': { boxShadow:'0 0 20px rgba(255,229,0,0.25),0 0 40px rgba(255,229,0,0.08)' },
          '50%':     { boxShadow:'0 0 35px rgba(255,229,0,0.55),0 0 70px rgba(255,229,0,0.18)' },
        },
        'border-glow': {
          '0%,100%': { borderColor:'rgba(255,229,0,0.2)' },
          '50%':     { borderColor:'rgba(255,229,0,0.7)' },
        },
        'bounce-subtle': {
          '0%,100%': { transform:'translateY(0)' },
          '50%':     { transform:'translateY(-4px)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition:'-200% center' },
          '100%': { backgroundPosition:'200% center' },
        },
        'stripe-march': {
          from: { backgroundPosition:'0 0' },
          to:   { backgroundPosition:'28px 0' },
        },
        'flicker': {
          '0%,19%,21%,23%,25%,54%,56%,100%': { opacity:1 },
          '20%,24%,55%': { opacity:0.6 },
        },
      },
      backgroundImage: {
        'yellow-gradient': 'linear-gradient(135deg, #FFE500 0%, #C4B000 100%)',
        'dark-gradient':   'linear-gradient(180deg, #111111 0%, #080808 100%)',
        'card-gradient':   'linear-gradient(135deg, #1e1e1e 0%, #111111 100%)',
        'bvb-hero':        'linear-gradient(135deg, #111100 0%, #080808 60%, #0a0a00 100%)',
      },
      dropShadow: {
        'yellow':    '0 0 12px rgba(255,229,0,0.6)',
        'yellow-lg': '0 0 24px rgba(255,229,0,0.8)',
      },
      boxShadow: {
        'yellow':    '0 0 20px rgba(255,229,0,0.3)',
        'yellow-lg': '0 0 40px rgba(255,229,0,0.5)',
        'yellow-inner': 'inset 0 0 20px rgba(255,229,0,0.08)',
      },
    },
  },
  plugins: [],
};
