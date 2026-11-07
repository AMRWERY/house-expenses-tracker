/** Wires the theme store to the page: pins ?theme=light|dark (previews) and applies the theme to <html>. */
export default defineNuxtPlugin((nuxtApp) => {
  const theme = useThemeStore();
  const router = useRouter();

  theme.pin(router.currentRoute.value.query.theme);
  theme.init();
  nuxtApp.hook("page:finish", () => theme.pin(router.currentRoute.value.query.theme));
});
