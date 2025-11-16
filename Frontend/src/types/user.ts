export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile extends User {
  phone?: string;
  bio?: string;
}