import type { Config } from "tailwindcss";

const config: Config = {
  // Only scan dirs that use Tailwind classes. Excludes _bak/, public/, node_modules.
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  // 'class' is inert on this site (no `.dark` is ever applied) but keeps
  // ui-layouts components that reference `dark:` from erroring.
  darkMode: "class",
  // CRITICAL: do NOT emit Tailwind's Preflight reset. With it off, Tailwind
  // only emits the @tailwind base tokens we author plus the utilities actually
  // used — nothing global leaks onto the existing plain-CSS / .rz-* system.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Map shadcn / ui-layouts semantic color utilities onto the CSS vars in
      // app/tailwind.css (@layer base :root). hsl(var(--x)) keeps opacity
      // modifiers (bg-background/80) working.
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted-bg))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent-bg))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // ui-layouts Marquee keyframes (animate-marquee* are dead without these).
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        "marquee-vertical": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(calc(-100% - var(--gap)))" },
        },
      },
      animation: {
        marquee: "marquee var(--duration) linear infinite",
        "marquee-reverse": "marquee var(--duration) linear infinite reverse",
        "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
        "marquee-vertical-reverse": "marquee-vertical var(--duration) linear infinite reverse",
      },
    },
  },
  plugins: [],
};

export default config;
