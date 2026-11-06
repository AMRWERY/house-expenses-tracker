// The user object stored in the session cookie (read it with useUserSession().user).
declare module '#auth-utils' {
  interface User {
    id: string
    userName: string
    displayName: string
  }
}

export {}
