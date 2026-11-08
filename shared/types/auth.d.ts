// The user object stored in the session cookie (read it with useUserSession().user).
// `id` is the Supabase Auth user id.
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    /** Greeting name: the one given at sign-up (or the email's first part). Missing on sessions started before names existed. */
    name?: string
  }
}

export {}
