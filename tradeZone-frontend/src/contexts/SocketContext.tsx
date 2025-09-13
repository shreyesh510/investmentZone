import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector } from '../redux/hooks';
import { useToast } from './toastContext';
import { messageStorage } from '../services/messageStorage';
import { type Message } from '../types/message';
import config from '../config/env';

interface SocketContextType {
  socket: Socket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  onlineUsers: OnlineUser[];
  messages: Message[];
  addMessage: (message: Message) => void;
}

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const user = useAppSelector((state) => state.auth.user);
  const { addToast } = useToast();

  // Load messages from localStorage on mount
  useEffect(() => {
    if (messageStorage.isStorageAvailable()) {
      const storedMessages = messageStorage.loadMessages();
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
        console.log(`📥 Loaded ${storedMessages.length} messages from localStorage`);
      }
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && messageStorage.isStorageAvailable()) {
      messageStorage.updateMessages(messages);
    }
  }, [messages]);

  const addMessage = (message: Message) => {
    setMessages(prev => {
      const updatedMessages = [...prev, message];
      // Keep only last 100 messages
      return updatedMessages.slice(-100);
    });
  };

  useEffect(() => {
    if (!user) {
      console.log('❌ No user found, not connecting to socket');
      return;
    }

    console.log('🔌 Creating socket connection for user:', user.id);

    const newSocket = io(config.API_BASE_URL, {
      auth: {
        user: {
          userId: user.id,
          userName: user.name || user.email,
        }
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      withCredentials: true,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
      setConnectionStatus('connected');
      newSocket.emit('getOnlineUsers');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error);
      setConnectionStatus('error');
    });

    newSocket.on('onlineUsers', (users: OnlineUser[]) => {
      console.log('👥 Online users received:', users);
      setOnlineUsers(users.filter(u => u.userId !== user.id));
    });

    newSocket.on('userJoined', (userData: OnlineUser) => {
      console.log('👋 User joined:', userData);
      if (userData.userId !== user.id) {
        setOnlineUsers(prev => [...prev, userData]);
      }
    });

    newSocket.on('userLeft', (userData: OnlineUser) => {
      console.log('👋 User left:', userData);
      setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
    });

    // Global message handling with toast notifications
    newSocket.on('newMessage', (message: Message) => {
      console.log('💬 New message received globally:', message);
      
      // Add message to global storage
      addMessage(message);
      
      // Show toast notification for messages from other users
      if (message.senderId !== user.id && message.senderId !== 'ai-assistant') {
        addToast({
          message: message.content,
          senderName: message.senderName || 'Unknown User',
          type: 'message',
          duration: 4000
        });
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up global socket connection');
      newSocket.close();
    };
  }, [user, addToast]);

  const value: SocketContextType = {
    socket,
    connectionStatus,
    onlineUsers,
    messages,
    addMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
