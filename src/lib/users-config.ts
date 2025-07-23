export interface UserConfig {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  whatsappSessionId: string;
}

export const USERS: UserConfig[] = [
  {
    id: 'user1',
    username: 'Cyndi Guzman',
    password: 'colombia2024',
    name: 'Cyndi Guzman',
    role: 'admin',
    whatsappSessionId: 'session-usuario1'
  },
  {
    id: 'user2', 
    username: 'usuario2',
    password: 'colombia2024',
    name: 'Usuario 2',
    role: 'user',
    whatsappSessionId: 'session-usuario2'
  }
];

export function validateUser(username: string, password: string): UserConfig | null {
  const user = USERS.find(u => 
    u.username === username && u.password === password
  );
  
  if (user) {
    return {
      id: user.id,
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
      whatsappSessionId: user.whatsappSessionId
    };
  }
  
  return null;
}

export function getUserBySessionId(sessionId: string): UserConfig | null {
  return USERS.find(u => u.whatsappSessionId === sessionId) || null;
} 