
# Context: Rubik's Cube Solver Landing Page

## 1. Project Overview
This project is a React/Tailwind landing page for a mobile Rubik's Cube Solver app. 
The app utilizes OpenCV for scanning and the Kociemba algorithm for solving. 
The visual style is a distressed, retro comic book aesthetic.

## 2. Design System (`DESIGN.md` integration)
- **Primary Colors:** Green (`#009B48`), Red (`#B71234`), Orange (`#FF5800`), Yellow (`#FFD500`), and Blue (`#0046AD`).
- **Background:** Yellow (`#FFD500`) with a grainy texture overlay.
- **Components:** Uses heavy `4px` black borders (`border-cube-black`) and sharp drop shadows (`shadow-[4px_4px_0px_0px_#1A1A1A]`) on primary panels (`.comic-panel`) and buttons (`.comic-button`).
- **Typography:** Display fonts use the `font-comic` utility class, and data text uses `font-mono`.

## 3. Core Component Code (Approved UI)

### 3.1 Hero Section
```html
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>CUBE SOLVER AI</title>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Anybody:ital,wght@0,100..900;1,100..900&amp;family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
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
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .bg-grainy {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
        }
    </style>
</head>
<body class="bg-background text-on-background min-h-screen flex flex-col font-body-md text-body-md overflow-x-hidden">
<header class="flex justify-between items-center w-full px-margin-desktop py-4 bg-background dark:bg-background border-b-4 border-cube-black dark:border-cube-black shadow-[4px_4px_0px_0px_#1A1A1A] w-full top-0 sticky z-50">
<div class="font-headline-lg text-headline-lg uppercase italic text-cube-black dark:text-cube-orange tracking-tight">
            CUBE_SOLVER
        </div>
<nav class="hidden md:flex items-center gap-gutter">
<a class="font-label-caps text-label-caps text-cube-orange font-bold underline decoration-4 underline-offset-4 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" href="#">SOLVER</a>
<a class="font-label-caps text-label-caps text-cube-black dark:text-cube-black hover:text-cube-blue hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" href="#">ALGORITHMS</a>
<a class="font-label-caps text-label-caps text-cube-black dark:text-cube-black hover:text-cube-blue hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" href="#">TUTORIALS</a>
</nav>
<button class="hidden md:block font-label-caps text-label-caps px-6 py-3 bg-cube-black text-paper-white border-2 border-cube-black shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none uppercase">
            GET STARTED
        </button>
<button class="md:hidden flex items-center justify-center p-2 border-2 border-cube-black shadow-comic hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-comic-hover active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
<span class="material-symbols-outlined" style="font-variation-settings: 'wght' 700;">menu</span>
</button>
</header>
<main class="flex-grow">
<section class="relative bg-cube-yellow w-full min-h-[819px] flex items-center justify-center py-20 px-margin-mobile md:px-margin-desktop overflow-hidden border-b-4 border-cube-black">
<div class="absolute inset-0 bg-grainy pointer-events-none opacity-50 mix-blend-multiply"></div>
<div class="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
<div class="relative group perspective-1000">
<div class="bg-cube-blue border-4 border-cube-black shadow-comic rounded-DEFAULT p-8 aspect-square flex items-center justify-center overflow-hidden transition-transform duration-500 ease-out transform group-hover:-translate-y-2 group-hover:rotate-1">
<div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyIiBmaWxsPSIjRkZGRkZGIiBvcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-20"></div>
<div class="relative z-10 w-full h-full flex flex-col items-center justify-center gap-4">
<span class="material-symbols-outlined text-paper-white text-8xl" style="font-variation-settings: 'FILL' 1;">view_in_ar</span>
<span class="font-headline-md text-headline-md text-paper-white uppercase text-center opacity-80 border-2 border-dashed border-paper-white/50 p-4 rounded-lg w-3/4">
                                Stylized Cube Graphic Here
                            </span>
</div>
</div>
</div>
<div class="flex flex-col items-start gap-8 px-4 md:px-8">
<h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg uppercase text-paper-white tracking-tighter" style="text-shadow: 4px 4px 0px #1A1A1A, -2px -2px 0 #1A1A1A, 2px -2px 0 #1A1A1A, -2px 2px 0 #1A1A1A, 2px 2px 0 #1A1A1A;">
                        SOLVED IN<br/><span class="text-cube-orange">23 MOVES!</span>
</h1>
<div class="bg-paper-white border-4 border-cube-black shadow-comic rounded-DEFAULT p-6 w-full max-w-md transform -rotate-1 hover:rotate-0 transition-transform">
<ul class="font-body-lg text-body-lg text-on-surface space-y-4 flex flex-col">
<li class="flex items-center gap-3">
<span class="material-symbols-outlined text-cube-blue" style="font-variation-settings: 'FILL' 1, 'wght' 700;">arrow_forward_ios</span>
<span class="font-bold border-b-2 border-cube-orange/30 pb-1">OpenCV Face Scanning</span>
</li>
<li class="flex items-center gap-3">
<span class="material-symbols-outlined text-cube-blue" style="font-variation-settings: 'FILL' 1, 'wght' 700;">arrow_forward_ios</span>
<span class="font-bold border-b-2 border-cube-orange/30 pb-1">Kociemba Algorithm Engine</span>
</li>
<li class="flex items-center gap-3">
<span class="material-symbols-outlined text-cube-blue" style="font-variation-settings: 'FILL' 1, 'wght' 700;">arrow_forward_ios</span>
<span class="font-bold border-b-2 border-cube-orange/30 pb-1">3D Animated Playback</span>
</li>
</ul>
</div>
<div class="mt-4">
<button class="bg-cube-green text-paper-white border-4 border-cube-black shadow-[6px_6px_0px_0px_#1A1A1A] hover:shadow-[3px_3px_0px_0px_#1A1A1A] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-all duration-150 px-10 py-5 rounded-DEFAULT font-headline-md text-headline-md uppercase tracking-wider flex items-center gap-4 group">
<span>DOWNLOAD APK</span>
<span class="material-symbols-outlined group-hover:translate-x-2 transition-transform" style="font-variation-settings: 'wght' 700;">download</span>
</button>
</div>
</div>
</div>
</section>
</main>
<footer class="flex flex-col md:flex-row justify-between items-center w-full px-margin-desktop py-12 gap-gutter bg-cube-black dark:bg-cube-black border-t-4 border-cube-black">
<div class="font-headline-md text-headline-md text-cube-orange italic tracking-tight">
            CUBE_SOLVER
        </div>
<nav class="flex flex-wrap justify-center gap-6">
<a class="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105" href="#">PRIVACY</a>
<a class="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105" href="#">TERMS</a>
<a class="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105" href="#">GITHUB</a>
<a class="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105" href="#">DISCORD</a>
</nav>
<div class="font-label-caps text-label-caps text-paper-white/60 text-center md:text-right">
            © 2024 CUBE SOLVER AI.<br class="md:hidden"/> ALL RIGHTS RESERVED. NO CHEATING!
        </div>
</footer>
</body></html>

```

### 3.2 'How it Works' Sequence

```html
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>CUBE_SOLVER - How it Works</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Anybody:ital,wght@0,100..900;1,100..900&amp;family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "tertiary-container": "#00efff",
                        "on-error": "#ffffff",
                        "primary-fixed": "#ffe174",
                        "on-surface-variant": "#4d4632",
                        "surface-container-highest": "#eae2cf",
                        "secondary-fixed": "#7ffc9c",
                        "primary": "#705d00",
                        "secondary-container": "#7ffc9c",
                        "surface": "#fff8ef",
                        "surface-container-low": "#fcf3e0",
                        "on-tertiary-container": "#006970",
                        "surface-variant": "#eae2cf",
                        "on-secondary-fixed": "#00210a",
                        "primary-fixed-dim": "#eac300",
                        "cube-black": "#1A1A1A",
                        "secondary-fixed-dim": "#62de82",
                        "inverse-primary": "#eac300",
                        "on-background": "#1f1b10",
                        "paper-white": "#FFFFFF",
                        "on-tertiary-fixed": "#002022",
                        "error": "#ba1a1a",
                        "surface-container": "#f6edda",
                        "on-primary-fixed": "#221b00",
                        "tertiary": "#006970",
                        "on-secondary-fixed-variant": "#005323",
                        "on-tertiary": "#ffffff",
                        "error-container": "#ffdad6",
                        "cube-orange": "#FF5800",
                        "outline": "#7f775f",
                        "surface-container-high": "#f0e7d5",
                        "outline-variant": "#d0c6ab",
                        "on-error-container": "#93000a",
                        "background": "#fff8ef",
                        "on-secondary-container": "#007434",
                        "on-secondary": "#ffffff",
                        "on-tertiary-fixed-variant": "#004f55",
                        "on-surface": "#1f1b10",
                        "on-primary-fixed-variant": "#554500",
                        "secondary": "#006d31",
                        "cube-blue": "#0046AD",
                        "tertiary-fixed-dim": "#00dbea",
                        "inverse-surface": "#343024",
                        "surface-bright": "#fff8ef",
                        "primary-container": "#ffd500",
                        "on-primary": "#ffffff",
                        "tertiary-fixed": "#81f4ff",
                        "cube-red": "#B71234",
                        "inverse-on-surface": "#f9f0dd",
                        "surface-tint": "#705d00",
                        "surface-container-lowest": "#ffffff",
                        "on-primary-container": "#705c00",
                        "surface-dim": "#e2d9c7"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "unit": "4px",
                        "margin-mobile": "16px",
                        "margin-desktop": "40px",
                        "panel-padding": "24px",
                        "gutter": "24px"
                    },
                    "fontFamily": {
                        "body-md": ["JetBrains Mono"],
                        "headline-md": ["anybody"],
                        "display-lg-mobile": ["anybody"],
                        "display-lg": ["anybody"],
                        "headline-lg": ["anybody"],
                        "label-caps": ["anybody"],
                        "body-lg": ["JetBrains Mono"]
                    },
                    "fontSize": {
                        "body-md": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "headline-md": ["28px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "display-lg-mobile": ["48px", { "lineHeight": "1.1", "fontWeight": "800" }],
                        "display-lg": ["72px", { "lineHeight": "1.1", "letterSpacing": "0.02em", "fontWeight": "800" }],
                        "headline-lg": ["40px", { "lineHeight": "1.2", "letterSpacing": "0.02em", "fontWeight": "700" }],
                        "label-caps": ["14px", { "lineHeight": "1", "letterSpacing": "0.1em", "fontWeight": "700" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "500" }]
                    }
                }
            }
        }
    </script>
<style>
        body {
            background-image: url('data:image/svg+xml;utf8,<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="1" fill="%231A1A1A" fill-opacity="0.1"/></svg>');
        }
    </style>
</head>
<body class="bg-surface font-body-md text-on-surface">
<!-- Top AppBar -->
<header class="w-full top-0 sticky border-b-4 border-cube-black dark:border-cube-black shadow-[4px_4px_0px_0px_#1A1A1A] z-50 flex justify-between items-center px-margin-desktop py-4 bg-background dark:bg-background">
<div class="font-headline-lg text-headline-lg uppercase italic text-cube-black dark:text-cube-orange">
            CUBE_SOLVER
        </div>
<nav class="hidden md:flex gap-8">
<a class="text-cube-black dark:text-cube-black hover:text-cube-blue font-label-caps text-label-caps hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" href="#">SOLVER</a>
<a class="text-cube-orange font-bold underline decoration-4 font-label-caps text-label-caps hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" href="#">ALGORITHMS</a>
<a class="text-cube-black dark:text-cube-black hover:text-cube-blue font-label-caps text-label-caps hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none" href="#">TUTORIALS</a>
</nav>
<button class="border-3 border-cube-black bg-secondary-fixed text-on-secondary-fixed font-label-caps text-label-caps uppercase px-6 py-2 shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
            GET STARTED
        </button>
</header>
<!-- Main Content Canvas -->
<main>
<!-- How it Works Section -->
<section class="w-full bg-paper-white border-y-4 border-cube-black py-20 px-margin-mobile md:px-margin-desktop">
<div class="max-w-7xl mx-auto">
<h2 class="font-headline-lg text-display-lg-mobile md:text-display-lg text-cube-black text-center mb-16 uppercase tracking-tight">
                    HOW IT WORKS
                </h2>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Card 1: Scan -->
<div class="bg-paper-white border-[4px] border-cube-black p-panel-padding shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all flex flex-col gap-6">
<h3 class="font-headline-md text-headline-md text-cube-black uppercase">
                            1. SCAN
                        </h3>
<div class="w-full aspect-square bg-cube-red border-[3px] border-cube-black flex items-center justify-center p-4 shadow-[inset_0px_0px_10px_rgba(0,0,0,0.5)]">
<span class="font-body-md text-body-md text-paper-white text-center">
                                [OpenCV Camera Viewport Placeholder]
                            </span>
</div>
<p class="font-body-md text-body-md text-cube-black">
                            Point your camera. Our OpenCV integration auto-detects all 6 faces instantly.
                        </p>
</div>
<!-- Card 2: Process -->
<div class="bg-paper-white border-[4px] border-cube-black p-panel-padding shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all flex flex-col gap-6">
<h3 class="font-headline-md text-headline-md text-cube-black uppercase">
                            2. PROCESS
                        </h3>
<div class="w-full aspect-square bg-cube-black border-[3px] border-cube-black flex items-center justify-center p-4">
<span class="font-body-md text-body-md text-secondary-fixed text-center">
                                &gt; [Kociemba Algorithm Matrix Placeholder]_
                            </span>
</div>
<p class="font-body-md text-body-md text-cube-black">
                            The Kociemba engine crunches the state to find the optimal 23-move solution.
                        </p>
</div>
<!-- Card 3: Solve -->
<div class="bg-paper-white border-[4px] border-cube-black p-panel-padding shadow-[4px_4px_0px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all flex flex-col gap-6">
<h3 class="font-headline-md text-headline-md text-cube-black uppercase">
                            3. SOLVE
                        </h3>
<div class="w-full aspect-square bg-cube-blue border-[3px] border-cube-black flex items-center justify-center p-4">
<span class="font-body-md text-body-md text-paper-white text-center">
                                [3D Cube Playback Placeholder]
                            </span>
</div>
<p class="font-body-md text-body-md text-cube-black">
                            Follow the gamified 3D animated playback step-by-step to crush your solve.
                        </p>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="w-full border-t-4 border-cube-black bg-cube-black dark:bg-cube-black flex flex-col md:flex-row justify-between items-center px-margin-desktop py-12 gap-gutter">
<div class="font-headline-md text-headline-md text-cube-orange uppercase">
            CUBE_SOLVER
        </div>
<div class="font-label-caps text-label-caps text-paper-white/80 text-center">
            © 2024 CUBE SOLVER AI. ALL RIGHTS RESERVED. NO CHEATING!
        </div>
<nav class="flex gap-6">
<a class="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105 inline-block" href="#">PRIVACY</a>
<a class="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105 inline-block" href="#">TERMS</a>
<a class="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105 inline-block" href="#">GITHUB</a>
<a class="font-label-caps text-label-caps text-paper-white/80 hover:text-cube-orange transition-colors hover:scale-105 inline-block" href="#">DISCORD</a>
</nav>
</footer>
</body></html>

```

### 3.3 Call to Action Banner

```html
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>CTA Section</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Anybody:ital,wght@0,400..900;1,400..900&amp;family=JetBrains+Mono:wght@400;500&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "inverse-primary": "#eac300",
                        "surface-variant": "#eae2cf",
                        "secondary-fixed": "#7ffc9c",
                        "surface-container": "#f6edda",
                        "primary-fixed": "#ffe174",
                        "cube-black": "#1A1A1A",
                        "on-tertiary-fixed-variant": "#004f55",
                        "surface-container-high": "#f0e7d5",
                        "on-error-container": "#93000a",
                        "on-tertiary": "#ffffff",
                        "on-secondary-container": "#007434",
                        "secondary-fixed-dim": "#62de82",
                        "on-primary-fixed-variant": "#554500",
                        "primary-container": "#ffd500",
                        "on-error": "#ffffff",
                        "cube-red": "#B71234",
                        "error": "#ba1a1a",
                        "inverse-surface": "#343024",
                        "on-tertiary-fixed": "#002022",
                        "on-tertiary-container": "#006970",
                        "secondary": "#006d31",
                        "primary-fixed-dim": "#eac300",
                        "tertiary-container": "#00efff",
                        "on-secondary": "#ffffff",
                        "outline": "#7f775f",
                        "on-secondary-fixed": "#00210a",
                        "on-primary-fixed": "#221b00",
                        "secondary-container": "#7ffc9c",
                        "on-surface": "#1f1b10",
                        "tertiary": "#006970",
                        "error-container": "#ffdad6",
                        "primary": "#705d00",
                        "on-primary": "#ffffff",
                        "surface-bright": "#fff8ef",
                        "surface-container-low": "#fcf3e0",
                        "tertiary-fixed-dim": "#00dbea",
                        "surface-container-lowest": "#ffffff",
                        "on-secondary-fixed-variant": "#005323",
                        "surface-tint": "#705d00",
                        "inverse-on-surface": "#f9f0dd",
                        "cube-orange": "#FF5800",
                        "paper-white": "#FFFFFF",
                        "background": "#fff8ef",
                        "surface-container-highest": "#eae2cf",
                        "on-surface-variant": "#4d4632",
                        "on-background": "#1f1b10",
                        "outline-variant": "#d0c6ab",
                        "cube-blue": "#0046AD",
                        "surface": "#fff8ef",
                        "on-primary-container": "#705c00",
                        "tertiary-fixed": "#81f4ff",
                        "surface-dim": "#e2d9c7"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "panel-padding": "24px",
                        "margin-mobile": "16px",
                        "margin-desktop": "40px",
                        "gutter": "24px",
                        "unit": "4px"
                    },
                    "fontFamily": {
                        "display-lg-mobile": ["anybody"],
                        "body-md": ["JetBrains Mono"],
                        "headline-md": ["anybody"],
                        "headline-lg": ["anybody"],
                        "display-lg": ["anybody"],
                        "body-lg": ["JetBrains Mono"],
                        "label-caps": ["anybody"]
                    },
                    "fontSize": {
                        "display-lg-mobile": ["48px", { "lineHeight": "1.1", "fontWeight": "800" }],
                        "body-md": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "headline-md": ["28px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "headline-lg": ["40px", { "lineHeight": "1.2", "letterSpacing": "0.02em", "fontWeight": "700" }],
                        "display-lg": ["72px", { "lineHeight": "1.1", "letterSpacing": "0.02em", "fontWeight": "800" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "500" }],
                        "label-caps": ["14px", { "lineHeight": "1", "letterSpacing": "0.1em", "fontWeight": "700" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>
<body class="bg-background text-on-background antialiased selection:bg-primary-container selection:text-on-primary-container">
<section class="w-full bg-cube-orange border-t-4 border-cube-black py-24 px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center relative overflow-hidden">
<!-- Decorative Halftone Pattern Background Overlay -->
<div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(#1A1A1A 20%, transparent 20%); background-size: 16px 16px;"></div>
<!-- Speech Bubble -->
<div class="relative z-10 bg-paper-white border-4 border-cube-black shadow-[4px_4px_0px_0px_#1A1A1A] px-6 py-3 mb-8 transform -rotate-2">
<p class="font-headline-md text-headline-md text-cube-black uppercase">EASIEST SOLVE EVER!</p>
<!-- Speech bubble tail -->
<div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-cube-black"></div>
<div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-paper-white"></div>
</div>
<!-- Headline -->
<h2 class="relative z-10 font-display-lg text-display-lg md:text-display-lg text-paper-white text-center uppercase mb-12 transform rotate-1" style="text-shadow: 4px 4px 0px #1A1A1A, -1px -1px 0 #1A1A1A, 1px -1px 0 #1A1A1A, -1px 1px 0 #1A1A1A, 1px 1px 0 #1A1A1A;">
            READY TO CRUSH YOUR PR?
        </h2>
<!-- Primary Button -->
<a class="relative z-10 group inline-flex items-center justify-center bg-secondary-fixed border-4 border-cube-black px-12 py-6 shadow-[8px_8px_0px_0px_#1A1A1A] transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none" href="#">
<span class="font-headline-lg text-headline-lg text-cube-black uppercase tracking-wider flex items-center gap-4">
                DOWNLOAD THE APK NOW
                <span class="material-symbols-outlined text-[40px] font-bold" data-weight="fill" style="font-variation-settings: 'FILL' 1;">download</span>
</span>
</a>
</section>
</body></html>

```

## 4. Implementation Directives for Code Agents

When implementing these components into the repository:

1. Extract the raw HTML snippets above into reusable functional React components (e.g., `Hero.tsx`, `HowItWorks.tsx`, `CTA.tsx`).
2. Map the `<script>` Tailwind configuration into the project's actual `tailwind.config.js`.
3. Locate the `[OpenCV Camera Viewport Placeholder]` and `[3D Cube Playback Placeholder]` in the `HowItWorks` component and prepare them as slots to receive the `<CameraView />` and `<Cube3D />` components.
---