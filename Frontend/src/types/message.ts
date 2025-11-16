import { User } from './user';

export interface RelatedUser {
  id: number;
  username: string;
}

export interface Message {
  id: string; // UUID
  room_id: string;
  admin_id?: string; // Añadir admin_id
  user_id?: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  is_edited?: boolean;
  admin?: {
    id: string;
    username: string; // Cambiar name a username
    email: string;
  };
  user?: {
    id: string;
    username: string; // Añadir user con username
    email: string;
  };
}

export interface Room {
  id: string; // UUID
  name: string;
  room_type: 'text' | 'multimedia';
  pin: string;
  last_message?: Message | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface SendMessagePayload {
  room_id: string; // UUID
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'audio' | 'video';
}

// Unifica para evitar conflictos de tipos
export type SendMessageData = SendMessagePayload;

export interface MessageResponse {
  success: boolean;
  message?: string;
  data?: Message;
}