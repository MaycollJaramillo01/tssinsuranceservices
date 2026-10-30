import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

// Use Node's dotenv parser instead of importing an undeclared transitive Vite dependency.
export function loadEnvironment(mode = 'production', directory = process.cwd()) {
  const values = {};
  for (const name of ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`]) {
    const path = resolve(directory, name);
    if (existsSync(path)) Object.assign(values, parseEnv(readFileSync(path, 'utf8')));
  }
  return { ...values, ...process.env };
}
