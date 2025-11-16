import { useEffect } from 'react';
import { messageService } from '../services/message.service';
import { SendMessagePayload } from '../types';
import { useMessageStore } from '../store/message.store';

export const useMessages = (roomId?: string) => {
  const {
    rooms,
    currentRoom,
    messages,
    isLoading,
    setRooms,
    setCurrentRoom,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    setLoading,
    clearMessages,
  } = useMessageStore();

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        const roomsData = await messageService.getRooms();
        setRooms(roomsData);
      } catch (error) {
        console.error('Error loading rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [setRooms, setLoading]);

  useEffect(() => {
    if (!roomId) {
      clearMessages();
      return;
    }

    const loadMessages = async () => {
      try {
        setLoading(true);
        const messagesData = await messageService.getMessages(roomId);
        setMessages(messagesData);
        
        const room = rooms.find((r) => r.id === roomId);
        if (room) {
          setCurrentRoom(room);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [roomId, setMessages, setCurrentRoom, setLoading, clearMessages, rooms]);

  const sendMessage = async (payload: SendMessagePayload) => {
    try {
      const newMessage = await messageService.sendMessage(payload);
      addMessage(newMessage);
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    try {
      await messageService.editMessage(messageId, content);
      updateMessage(messageId, content);
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  };

  const removeMessage = async (messageId: string) => {
    try {
      await messageService.deleteMessage(messageId);
      deleteMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  return {
    rooms,
    currentRoom,
    messages,
    isLoading,
    sendMessage,
    editMessage,
    removeMessage,
  };
};