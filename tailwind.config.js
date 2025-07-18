/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Core Colors */
        background: 'var(--color-background)', // black
        foreground: 'var(--color-foreground)', // white
        surface: 'var(--color-surface)', // gray-900
        border: 'var(--color-border)', // white with opacity
        input: 'var(--color-input)', // gray-900
        ring: 'var(--color-ring)', // lime-500

        /* Card Colors */
        card: {
          DEFAULT: 'var(--color-card)', // gray-900
          foreground: 'var(--color-card-foreground)' // white
        },
        popover: {
          DEFAULT: 'var(--color-popover)', // gray-900
          foreground: 'var(--color-popover-foreground)' // white
        },

        /* Muted Colors */
        muted: {
          DEFAULT: 'var(--color-muted)', // gray-800
          foreground: 'var(--color-muted-foreground)' // gray-400
        },

        /* Primary Colors */
        primary: {
          DEFAULT: 'var(--color-primary)', // lime-500
          foreground: 'var(--color-primary-foreground)' // black
        },

        /* Secondary Colors */
        secondary: {
          DEFAULT: 'var(--color-secondary)', // green-500
          foreground: 'var(--color-secondary-foreground)' // white
        },

        /* Accent Colors */
        accent: {
          DEFAULT: 'var(--color-accent)', // amber-400
          foreground: 'var(--color-accent-foreground)' // black
        },

        /* State Colors */
        success: {
          DEFAULT: 'var(--color-success)', // emerald-500
          foreground: 'var(--color-success-foreground)' // white
        },
        warning: {
          DEFAULT: 'var(--color-warning)', // amber-500
          foreground: 'var(--color-warning-foreground)' // white
        },
        error: {
          DEFAULT: 'var(--color-error)', // red-500
          foreground: 'var(--color-error-foreground)' // white
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', // red-500
          foreground: 'var(--color-destructive-foreground)' // white
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
        'headline': ['Inter', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'cta': ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'headline-xl': ['3.5rem', { lineHeight: '1.1', fontWeight: '900' }], // 56px
        'headline-lg': ['2.5rem', { lineHeight: '1.2', fontWeight: '800' }], // 40px
        'headline-md': ['2rem', { lineHeight: '1.25', fontWeight: '700' }], // 32px
        'headline-sm': ['1.5rem', { lineHeight: '1.33', fontWeight: '700' }], // 24px
        'body-lg': ['1.125rem', { lineHeight: '1.56', fontWeight: '400' }], // 18px
        'body-md': ['1rem', { lineHeight: '1.5', fontWeight: '400' }], // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.43', fontWeight: '400' }], // 14px
        'cta-lg': ['1.125rem', { lineHeight: '1.33', fontWeight: '600' }], // 18px
        'cta-md': ['1rem', { lineHeight: '1.5', fontWeight: '600' }], // 16px
        'mono-md': ['1rem', { lineHeight: '1.5', fontWeight: '400' }], // 16px
        'mono-sm': ['0.875rem', { lineHeight: '1.43', fontWeight: '400' }] // 14px
      },
      spacing: {
        '18': '4.5rem', // 72px
        '22': '5.5rem', // 88px
        '26': '6.5rem', // 104px
        '30': '7.5rem', // 120px
        '34': '8.5rem', // 136px
        '38': '9.5rem', // 152px
        '42': '10.5rem', // 168px
        '46': '11.5rem', // 184px
        '50': '12.5rem', // 200px
        '54': '13.5rem', // 216px
        '58': '14.5rem', // 232px
        '62': '15.5rem', // 248px
        '66': '16.5rem', // 264px
        '70': '17.5rem', // 280px
        '74': '18.5rem', // 296px
        '78': '19.5rem', // 312px
        '82': '20.5rem', // 328px
        '86': '21.5rem', // 344px
        '90': '22.5rem', // 360px
        '94': '23.5rem', // 376px
        '98': '24.5rem' // 392px
      },
      maxWidth: {
        'container': '1200px'
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px'
      },
      boxShadow: {
        'glassmorphism': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'cta': '0 0 0 1px rgba(132, 204, 22, 0.2), 0 4px 16px rgba(0, 0, 0, 0.4)',
        'cta-hover': '0 0 0 2px rgba(132, 204, 22, 0.4), 0 8px 24px rgba(0, 0, 0, 0.5)'
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 200ms ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      transitionDuration: {
        '200': '200ms',
        '250': '250ms'
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        '200': '200'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwindcss-animate')
  ]
}