import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split(":")
  if (parts.length !== 3 || parts[0] !== "scrypt") return false
  const salt = Buffer.from(parts[1], "hex")
  const expected = Buffer.from(parts[2], "hex")
  if (salt.length === 0 || expected.length === 0) return false
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer
  if (derived.length !== expected.length) return false
  return timingSafeEqual(derived, expected)
}
