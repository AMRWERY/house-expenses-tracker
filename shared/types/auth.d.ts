// The user object stored in the session cookie (read it with useUserSession().user).
// `id` is the Supabase Auth user id.
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
  }
}

export {}
