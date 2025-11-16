import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../utils/constants';
import { useMessageStore } from '../store';
import { Message } from '../types';

export const useSocket = (token: string | null, roomId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { addMessage, updateMessage, deleteMessage, addTypingUser, removeTypingUser } = useMessageStore();

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket conectado');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error);
      setIsConnected(false);
    });

    socket.on('new_message', (message: Message) => {
      addMessage(message);
    });

    socket.on('message_edited', (message: Message) => {
      updateMessage(message.id, message.content);
    });

    socket.on('message_deleted', (data: { message_id: string }) => {
      deleteMessage(data.message_id);
    });

    socket.on('user_typing', (data: { user_id: string; username: string }) => {
      addTypingUser(data.user_id);
      setTimeout(() => {
        removeTypingUser(data.user_id);
      }, 3000);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, addMessage, updateMessage, deleteMessage, addTypingUser, removeTypingUser]);

  useEffect(() => {
    if (roomId) {
      socketRef.current?.emit('join_room', roomId);

      return () => {
        socketRef.current?.emit('leave_room', roomId);
      };
    }
  }, [roomId]);

  const sendTyping = (roomId: string) => {
    socketRef.current?.emit('typing', roomId);
  };

  return { socket: socketRef.current, isConnected, sendTyping };
};