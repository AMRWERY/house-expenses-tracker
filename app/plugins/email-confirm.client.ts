/**
 * Landing point of the confirmation email. Supabase sends the person back to the site with the result in
 * the URL after the #: an access token on success (type=signup), or error_code=... (e.g. otp_expired).
 * On success we sign them in and open the home page; on failure we say so in a toast.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Read it right away, before any redirect or navigation can drop the fragment.
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const failed = params.has("error") || params.has("error_code");
  if (!(accessToken && params.get("type") === "signup") && !failed) return;

  // The token is a credential: take it out of the address bar (and history) immediately.
  history.replaceState(null, "", location.pathname + location.search);

  nuxtApp.hook("app:mounted", async () => {
    // The router puts the hash back when it first settles, so clear it again now.
    history.replaceState(null, "", location.pathname + location.search);
    const toast = useToastStore();
    const { t } = nuxtApp.$i18n as { t: (key: string) => string };
    const fail = () => toast.show({ text: t("confirm_failed"), kind: "error", position: "center" });

    if (!accessToken) return fail();
    try {
      await $fetch("/api/auth/confirm", { method: "POST", body: { accessToken } });
      await useUserSession().fetch();
      await navigateTo(nuxtApp.$localePath("/"));
      toast.show({ text: t("email_confirmed"), position: "center" });
    } catch {
      fail();
    }
  });
});
