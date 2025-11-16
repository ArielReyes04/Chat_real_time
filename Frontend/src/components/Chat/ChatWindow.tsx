import React, { useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useMessages } from '../../hooks/useMessages';
import { useSocket } from '../../hooks/useSocket';
import { useMessageStore } from '../../store';
import './ChatWindow.css';

export interface ChatWindowProps {
  roomId: string; // string (UUID)
}

const ChatWindow: React.FC<ChatWindowProps> = ({ roomId }) => {
  const { currentRoom, messages, isLoading, sendMessage, editMessage, removeMessage } = useMessages(roomId);
  const { sendTyping } = useSocket(roomId);
  const { typingUsers } = useMessageStore();

  const handleSendMessage = async (content: string) => {
    if (!roomId) return;

    try {
      await sendMessage({
        room_id: roomId,
        content,
        message_type: 'text',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    }
  };

  const handleTyping = () => {
    if (roomId) {
      sendTyping(roomId);
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      await editMessage(messageId, content);
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Error al editar el mensaje');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await removeMessage(messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error al eliminar el mensaje');
    }
  };

  if (isLoading) {
    return (
      <div className="chat-window loading">
        <div className="spinner"></div>
        <p>Cargando chat...</p>
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <h2>Selecciona una conversación</h2>
          <p>Elige un chat de la lista o crea uno nuevo para comenzar a conversar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-info">
          <h2 className="chat-title">{currentRoom?.name || 'Chat'}</h2>
          <span className="chat-type">
            {currentRoom?.room_type === 'text' ? '📝 Texto' : '🎬 Multimedia'}
          </span>
        </div>
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
            <span className="typing-text">Escribiendo...</span>
          </div>
        )}
      </div>

      <MessageList
        messages={messages}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={isLoading}
      />
    </div>
  );
};

export default ChatWindow;