// users.ts - You can place this in a utils folder or similar

export type UserRole = 'scouter' | 'head-scouter' | 'admin';

export interface User {
  username: string;
  password: string; // For simplicity, store plaintext passwords (not recommended for production)
  role: UserRole;
}

export const users: User[] = [
  { username: 'scouter', password: 'password1', role: 'scouter' },
  { username: 'head-scouter', password: 'password2', role: 'head-scouter' },
  { username: 'admin', password: 'adminpass', role: 'admin' }
];

export function authenticate(username: string, password: string): User | null {
  const user = users.find(u => u.username === username && u.password === password);
  return user || null;
}
