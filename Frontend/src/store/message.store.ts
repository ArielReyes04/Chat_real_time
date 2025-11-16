import { create } from 'zustand';
import { Message, Room } from '../types';

interface MessageState {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Message[];
  isLoading: boolean;
  typingUsers: Set<string>; // Añadir typingUsers
  setRooms: (rooms: Room[]) => void;
  setCurrentRoom: (room: Room | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  addTypingUser: (userId: string) => void; // string
  removeTypingUser: (userId: string) => void; // string
}

export const useMessageStore = create<MessageState>((set) => ({
  rooms: [],
  currentRoom: null,
  messages: [],
  isLoading: false,
  typingUsers: new Set(),

  setRooms: (rooms) => set({ rooms }),

  setCurrentRoom: (room) => set({ currentRoom: room }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (messageId, content) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content, is_edited: true } : msg
      ),
    })),

  deleteMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== messageId),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [], currentRoom: null }),

  addTypingUser: (userId) =>
    set((state) => ({
      typingUsers: new Set(state.typingUsers).add(userId),
    })),

  removeTypingUser: (userId) =>
    set((state) => {
      const newSet = new Set(state.typingUsers);
      newSet.delete(userId);
      return { typingUsers: newSet };
    }),
}));