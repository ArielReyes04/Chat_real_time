import { useEffect, useRef } from 'react';
import { Message } from '../../types';
import { useAuthContext } from '../../context/AuthContext';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  onDeleteMessage?: (messageId: string) => void; // string
  onEditMessage?: (messageId: string, content: string) => void; // string
}

export const MessageList = ({ messages, onDeleteMessage, onEditMessage }: MessageListProps) => {
  const { user } = useAuthContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-messages">
          <p>No hay mensajes aún. ¡Comienza la conversación!</p>
        </div>
      ) : (
        messages.map((message) => {
          // Un admin envía mensajes con admin_id; los del usuario final tienen user_id
          const isOwnMessage = message.admin_id === user?.id;

          const senderName = message.user?.username || message.admin?.username;

          return (
            <div
              key={message.id}
              className={`message ${isOwnMessage ? 'message-own' : 'message-other'}`}
            >
              <div className="message-content">
                {!isOwnMessage && senderName && (
                  <div className="message-sender">{senderName}</div>
                )}
                <div className="message-bubble">
                  <p className="message-text">{message.content}</p>
                  <div className="message-footer">
                    <span className="message-time">{formatTime(message.created_at)}</span>
                    {message.is_edited && (
                      <span className="message-edited">(editado)</span>
                    )}
                  </div>
                </div>
                {isOwnMessage && (
                  <div className="message-actions">
                    <button
                      onClick={() => {
                        const newContent = prompt('Editar mensaje:', message.content);
                        if (newContent && newContent !== message.content) {
                          onEditMessage?.(message.id, newContent);
                        }
                      }}
                      className="btn-edit"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Eliminar este mensaje?')) {
                          onDeleteMessage?.(message.id);
                        }
                      }}
                      className="btn-delete"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};