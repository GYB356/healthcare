import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

// Hash password before saving it to the database
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Compare user-entered password with stored hash
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
} 