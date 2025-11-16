import { useState, useEffect } from 'react';
import ChatWindow from '../components/Chat/ChatWindow';
import { useMessages } from '../hooks/useMessages';
import { messageService } from '../services/message.service';
import { Room } from '../types';
import './ChatRoom.css';

export const ChatRoom = () => {
  const { rooms, isLoading } = useMessages();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null); // string en lugar de number
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  const formatLastMessage = (room: Room) => {
    if (!room.last_message) return 'Sin mensajes';
    const content = room.last_message.content;
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  const formatTime = (date: string | Date) => {
    const messageDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  // ✅ Función para crear nueva conversación
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      alert('Por favor ingresa un nombre para la conversación');
      return;
    }

    try {
      setIsCreating(true);

      // Enviar solo lo que el backend suele esperar
      const newRoom = await messageService.createRoom({
        name: newRoomName.trim(),
        room_type: 'text', // Cambia de 'private' a 'text'
      });

      console.log('✅ Sala creada:', newRoom);

      setShowNewChatModal(false);
      setNewRoomName('');

      if (newRoom?.id) {
        setSelectedRoomId(newRoom.id);
      }

      // TODO: idealmente refetch sin recargar
      window.location.reload();
    } catch (error: any) {
      console.error('Error creando sala:', error);
      alert(error?.response?.data?.message ?? 'Error al crear la conversación');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedRoomId || !content.trim()) return;

    try {
      await messageService.sendMessage({
        room_id: selectedRoomId, // Ahora es string (UUID)
        content: content.trim(),
      });
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  return (
    <div className="chatroom-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>💬 Conversaciones</h2>
          <button 
            className="btn-new-chat" 
            title="Nueva conversación"
            onClick={() => setShowNewChatModal(true)}
          >
            ➕
          </button>
        </div>

        <div className="rooms-list">
          {isLoading ? (
            <div className="loading-rooms">
              <div className="spinner"></div>
              <p>Cargando conversaciones...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-rooms">
              <p>No hay conversaciones</p>
              <button 
                className="btn-create-room"
                onClick={() => setShowNewChatModal(true)}
              >
                Crear una
              </button>
            </div>
          ) : (
            rooms.map((room) => (
              <div
                key={room.id}
                className={`room-item ${selectedRoomId === room.id ? 'active' : ''}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <div className="room-avatar">
                  {room.room_type === 'text' ? '👤' : '👥'}
                </div>
                <div className="room-info">
                  <div className="room-header">
                    <h3 className="room-name">{room.name}</h3>
                    {room.last_message && (
                      <span className="room-time">
                        {formatTime(room.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="room-footer">
                    <p className="room-last-message">{formatLastMessage(room)}</p>
                    {room.unread_count && room.unread_count > 0 && (
                      <span className="unread-badge">{room.unread_count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedRoomId ? (
          <ChatWindow key={selectedRoomId} roomId={selectedRoomId} />
        ) : (
          <div className="no-chat-selected">
            <h2>Selecciona una conversación</h2>
            <p>Elige un chat de la lista para comenzar a conversar</p>
          </div>
        )}
      </div>

      {/* ✅ Modal para crear nueva conversación */}
      {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nueva Conversación</h3>
              <button 
                className="btn-close"
                onClick={() => setShowNewChatModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Nombre de la conversación"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowNewChatModal(false)}
                disabled={isCreating}
              >
                Cancelar
              </button>
              <button 
                className="btn-create"
                onClick={handleCreateRoom}
                disabled={isCreating || !newRoomName.trim()}
              >
                {isCreating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};