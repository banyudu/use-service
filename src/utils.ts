import { nanoid } from 'nanoid/index.browser'
export const random = (): string => {
  try {
    return nanoid()
  } catch (error) {
    return String(Math.random()).substring(2, 14)
  }
}
