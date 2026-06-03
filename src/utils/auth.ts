export function getUser(): string | null {
  return localStorage.getItem('maritime_user');
}

export function saveUser(user: string): void {
  localStorage.setItem('maritime_user', user);
}

export function clearUser(): void {
  localStorage.removeItem('maritime_user');
}
