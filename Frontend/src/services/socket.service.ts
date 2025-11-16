import { io, Socket } from 'socket.io-client';
import { Message } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private readonly url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

  connect() {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('token');
    
    this.socket = io(this.url, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión socket:', error);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinRoom(roomId: string) { // string
    this.socket?.emit('join_room', { room_id: roomId });
    console.log('📥 Unido a room:', roomId);
  }

  leaveRoom(roomId: string) { // string
    this.socket?.emit('leave_room', { room_id: roomId });
    console.log('📤 Salió de room:', roomId);
  }

  emitTyping(roomId: string) { // string
    this.socket?.emit('typing', { room_id: roomId });
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('new_message', callback);
  }

  onMessageEdited(callback: (message: Message) => void) {
    this.socket?.on('message_edited', callback);
  }

  onMessageDeleted(callback: (data: { message_id: string }) => void) { // string
    this.socket?.on('message_deleted', callback);
  }

  onUserTyping(callback: (data: { user_id: string; username: string }) => void) { // string
    this.socket?.on('user_typing', callback);
  }

  offNewMessage() {
    this.socket?.off('new_message');
  }

  offMessageEdited() {
    this.socket?.off('message_edited');
  }

  offMessageDeleted() {
    this.socket?.off('message_deleted');
  }

  offUserTyping() {
    this.socket?.off('user_typing');
  }
}

export const socketService = new SocketService();