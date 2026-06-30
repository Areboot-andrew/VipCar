import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#131314",
        "secondary-fixed": "#ffe088",
        "inverse-on-surface": "#303031",
        "on-primary-fixed-variant": "#474647",
        "on-tertiary-fixed": "#1a1c1c",
        "primary-fixed": "#e5e2e3",
        "primary": "#c8c6c7",
        "on-tertiary": "#2f3131",
        "on-error": "#690005",
        "outline-variant": "#46474a",
        "primary-container": "#1a1a1b",
        "outline": "#909094",
        "tertiary": "#c6c6c7",
        "secondary-container": "#af8d11",
        "on-secondary-fixed": "#241a00",
        "inverse-primary": "#5f5e5f",
        "tertiary-fixed": "#e2e2e2",
        "on-secondary-fixed-variant": "#574500",
        "inverse-surface": "#e4e2e3",
        "on-error-container": "#ffdad6",
        "on-secondary": "#3c2f00",
        "tertiary-container": "#191b1b",
        "background": "#131314",
        "surface-bright": "#39393a",
        "surface-container-low": "#1b1b1c",
        "surface-container-lowest": "#0e0e0f",
        "error": "#ffb4ab",
        "secondary": "#e9c349",
        "surface-dim": "#131314",
        "on-primary": "#303031",
        "on-background": "#e4e2e3",
        "on-surface-variant": "#c7c6ca",
        "primary-fixed-dim": "#c8c6c7",
        "tertiary-fixed-dim": "#c6c6c7",
        "on-tertiary-fixed-variant": "#454747",
        "on-primary-container": "#848283",
        "error-container": "#93000a",
        "surface-container-high": "#2a2a2b",
        "surface-variant": "#353536",
        "on-secondary-container": "#342800",
        "on-tertiary-container": "#828383",
        "surface-tint": "#c8c6c7",
        "secondary-fixed-dim": "#e9c349",
        "on-surface": "#e4e2e3",
        "on-primary-fixed": "#1b1b1c",
        "surface-container-highest": "#353536",
        "surface-container": "#1f1f20"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "margin-desktop": "64px",
        "container-max": "1280px",
        "gutter": "32px",
        "unit": "8px",
        "stack-md": "48px",
        "margin-mobile": "24px",
        "stack-lg": "80px"
      },
      fontFamily: {
        "headline-md": ["Playfair Display", "serif"],
        "label-caps": ["Montserrat", "sans-serif"],
        "body-md": ["Montserrat", "sans-serif"],
        "headline-lg": ["Playfair Display", "serif"],
        "display-lg": ["Playfair Display", "serif"],
        "body-lg": ["Montserrat", "sans-serif"],
        "display-lg-mobile": ["Playfair Display", "serif"],
        "button": ["Montserrat", "sans-serif"]
      },
      fontSize: {
        "headline-md": ["32px", { "lineHeight": "40px", "fontWeight": "600" }],
        "label-caps": ["12px", { "lineHeight": "16px", "letterSpacing": "0.15em", "fontWeight": "700" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "headline-lg": ["48px", { "lineHeight": "56px", "fontWeight": "600" }],
        "display-lg": ["64px", { "lineHeight": "72px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-lg": ["18px", { "lineHeight": "28px", "letterSpacing": "0.01em", "fontWeight": "400" }],
        "display-lg-mobile": ["40px", { "lineHeight": "48px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "button": ["14px", { "lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "600" }]
      }
    },
  },
  plugins: [],
};

export default config;
