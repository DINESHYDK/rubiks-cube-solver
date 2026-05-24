import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            darkMode: "class",
            theme: {
              extend: {
                colors: {
                  "background": "#fff8ef",
                  "paper-white": "#FFFFFF",
                  "inverse-on-surface": "#f9f0dd",
                  "cube-orange": "#FF5800",
                  "on-primary-container": "#705c00",
                  "surface": "#fff8ef",
                  "tertiary-fixed": "#81f4ff",
                  "surface-dim": "#e2d9c7",
                  "cube-blue": "#0046AD",
                  "outline-variant": "#d0c6ab",
                  "on-background": "#1f1b10",
                  "surface-container-highest": "#eae2cf",
                  "on-surface-variant": "#4d4632",
                  "surface-container-low": "#fcf3e0",
                  "surface-bright": "#fff8ef",
                  "on-primary": "#ffffff",
                  "on-secondary-fixed-variant": "#005323",
                  "surface-container-lowest": "#ffffff",
                  "surface-tint": "#705d00",
                  "tertiary-fixed-dim": "#00dbea",
                  "tertiary-container": "#00efff",
                  "primary-fixed-dim": "#eac300",
                  "secondary": "#006d31",
                  "on-primary-fixed": "#221b00",
                  "on-secondary-fixed": "#00210a",
                  "outline": "#7f775f",
                  "on-secondary": "#ffffff",
                  "error": "#ba1a1a",
                  "cube-red": "#B71234",
                  "on-tertiary-container": "#006970",
                  "on-tertiary-fixed": "#002022",
                  "inverse-surface": "#343024",
                  "primary": "#705d00",
                  "error-container": "#ffdad6",
                  "tertiary": "#006970",
                  "on-surface": "#1f1b10",
                  "secondary-container": "#7ffc9c",
                  "surface-container": "#f6edda",
                  "secondary-fixed": "#7ffc9c",
                  "surface-variant": "#eae2cf",
                  "inverse-primary": "#eac300",
                  "primary-container": "#ffd500",
                  "on-error": "#ffffff",
                  "on-primary-fixed-variant": "#554500",
                  "secondary-fixed-dim": "#62de82",
                  "on-secondary-container": "#007434",
                  "on-tertiary": "#ffffff",
                  "surface-container-high": "#f0e7d5",
                  "on-tertiary-fixed-variant": "#004f55",
                  "primary-fixed": "#ffe174",
                  "cube-black": "#1A1A1A",
                  "on-error-container": "#93000a",
                  "cube-green": "#009B48",
                  "cube-yellow": "#FFD500"
                },
                borderRadius: {
                  "DEFAULT": "0.25rem",
                  "lg": "0.5rem",
                  "xl": "0.75rem",
                  "full": "9999px"
                },
                spacing: {
                  "unit": "4px",
                  "panel-padding": "24px",
                  "margin-mobile": "16px",
                  "margin-desktop": "40px",
                  "gutter": "24px"
                },
                fontFamily: {
                  "label-caps": ["Anybody", "sans-serif"],
                  "headline-md": ["Anybody", "sans-serif"],
                  "headline-lg": ["Anybody", "sans-serif"],
                  "body-lg": ["JetBrains Mono", "monospace"],
                  "display-lg": ["Anybody", "sans-serif"],
                  "display-lg-mobile": ["Anybody", "sans-serif"],
                  "body-md": ["JetBrains Mono", "monospace"]
                },
                fontSize: {
                  "label-caps": ["14px", { lineHeight: "1", letterSpacing: "0.1em", fontWeight: "700" }],
                  "headline-md": ["28px", { lineHeight: "1.2", fontWeight: "700" }],
                  "headline-lg": ["40px", { lineHeight: "1.2", letterSpacing: "0.02em", fontWeight: "700" }],
                  "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "500" }],
                  "display-lg": ["72px", { lineHeight: "1.1", letterSpacing: "0.02em", fontWeight: "800" }],
                  "display-lg-mobile": ["48px", { lineHeight: "1.1", fontWeight: "800" }],
                  "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }]
                },
                boxShadow: {
                  'comic': '4px 4px 0px 0px #1A1A1A',
                  'comic-hover': '2px 2px 0px 0px #1A1A1A',
                }
              }
            }
          };
        ` }} />
        <link href="https://fonts.googleapis.com/css2?family=Anybody:ital,wght@0,100..900;1,100..900&amp;family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&amp;display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #0D1117;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0D1117;
  }
}`;
