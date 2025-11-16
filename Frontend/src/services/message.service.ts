import { apiClient } from '../api/client';
import { Message, SendMessagePayload } from '../types';

export const messageService = {
  async sendMessage(data: SendMessagePayload): Promise<Message> {
    const payload = {
      room_id: data.room_id,
      content: data.content,
      message_type: data.message_type || 'text',
    };
    const res = await apiClient.post('/api/messages/send', payload);
    return res.data?.data || res.data;
  },

  async getMessages(roomId: string): Promise<Message[]> { // string
    const res = await apiClient.get(`/api/messages/room/${roomId}`);
    return res.data?.data || [];
  },

  async getRooms(): Promise<any[]> {
    const res = await apiClient.get('/api/messages/rooms');
    return res.data?.data || [];
  },

  async createRoom(payload: { name: string; room_type: 'text' | 'multimedia' }) {
    const { data } = await apiClient.post('/api/messages/rooms', payload);
    return data?.data ?? data;
  },

  async editMessage(messageId: string, content: string): Promise<Message> { // string
    const res = await apiClient.put(`/api/messages/${messageId}`, { content });
    return res.data?.data || res.data;
  },

  async deleteMessage(messageId: string): Promise<void> { // string
    await apiClient.delete(`/api/messages/${messageId}`);
  }
};