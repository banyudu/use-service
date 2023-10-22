export const random = (): string => {
  try {
    // eslint-disable-next-line
    const { nanoid } = require('nanoid')
    return nanoid()
  } catch (error) {
    return String(Math.random()).substring(2, 14)
  }
}
