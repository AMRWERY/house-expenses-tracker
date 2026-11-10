// The signed-in person's profile picture. Without one, send them to the default picture.
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const avatar = await readAvatar(user.id)
  if (!avatar) return sendRedirect(event, '/img/fake-user.png', 302)

  setHeader(event, 'Content-Type', avatar.mime)
  setHeader(event, 'Cache-Control', 'private, no-cache') // the page adds ?v=N after an upload to skip the browser copy
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  return avatar.bytes
})
