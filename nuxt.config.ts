import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxtjs/i18n", "@pinia/nuxt", "@vueuse/nuxt", "nuxt-auth-utils"],

  // Passkey (fingerprint / Face ID) sign-in. Set NUXT_SESSION_PASSWORD (32+ chars) in production;
  // in dev the module generates one into .env.
  auth: { webAuthn: true },
  runtimeConfig: {
    session: { maxAge: 60 * 60 * 24 * 30 }, // stay signed in for 30 days
  },

  // Users, passkeys and expenses live here. Swap the driver (redis, db, ...) for multi-server / production.
  nitro: {
    storage: {
      data: { driver: "fs", base: "./.data/kv" },
    },
  },

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      title: "مصروفات البيت",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      ],
      script: [
        {
          // Runs before first paint so a refresh never flashes the wrong theme.
          // Mirrors useTheme(): ?theme=light|dark wins, then the saved choice, then the OS setting.
          tagPosition: "head",
          tagPriority: "critical",
          innerHTML:
            "(function(){try{var q=new URLSearchParams(location.search).get('theme');var m=(q==='light'||q==='dark')?q:(localStorage.getItem('theme')||'system');var d=m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}})()",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap",
        },
      ],
    },
  },

  i18n: {
    // i18n files live under app/config/i18n
    restructureDir: "app",
    langDir: "config/i18n/locales",
    vueI18n: "config/i18n/i18n.config.ts",
    defaultLocale: "ar",
    strategy: "prefix",
    locales: [
      { code: "en", iso: "en-US", name: "English", file: "en.json" },
      { code: "ar", iso: "ar-EG", name: "العربية", dir: "rtl", file: "ar.json" },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },
  },
});
