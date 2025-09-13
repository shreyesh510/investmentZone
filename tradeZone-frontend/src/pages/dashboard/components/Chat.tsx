import { useCallback, useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { generateOpenAIResponse } from '../../../redux/thunks/openai/openAI';
import { useSettings, cryptoOptions, timeframeOptions } from '../../../contexts/settingsContext';
import { useToast } from '../../../contexts/toastContext';
import { useSocket } from '../../../contexts/socketContext';
import { messageStorage } from '../../../services/messageStorage';
import { type Message } from '../../../types/message';
import { marketContextService } from '../../../services/marketContext';
import { usePermissions } from '../../../hooks/usePermissions';

interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
}

interface ChatProps {
  onlineUsers: OnlineUser[];
  setOnlineUsers: (users: OnlineUser[]) => void;
}

const Chat = ({ onlineUsers, setOnlineUsers }: ChatProps) => {
  const { settings, updateSettings } = useSettings();
  const { socket: globalSocket, messages: globalMessages, addMessage } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [aiMode, setAiMode] = useState<boolean>(false);
  const [showAiWarning, setShowAiWarning] = useState<boolean>(false);
  const [marketContextSummary, setMarketContextSummary] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>(settings.defaultCrypto);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(settings.defaultTimeframe);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState<boolean>(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const symbolDropdownRef = useRef<HTMLDivElement>(null);
  const timeframeDropdownRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { loading: aiLoading, error: aiError } = useAppSelector((state) => state.openai);

  // Use settings for theme
  const isDarkMode = settings.theme === 'dark';

  // Global toast functions
  const { addToast } = useToast();
  
  // Permissions
  const { permissions, canAccessAiChat } = usePermissions();

  // Sync global messages with local state
  useEffect(() => {
    setMessages(globalMessages);
  }, [globalMessages]);

  // Initialize market context service when AI mode is enabled
  useEffect(() => {
    if (aiMode) {
      console.log('🤖 AI mode enabled - starting market context service');
      marketContextService.startAutoUpdate();
      
      // Update market summary periodically
      const updateSummary = () => {
        const summary = marketContextService.getQuickSummary();
        setMarketContextSummary(summary);
      };
      
      updateSummary();
      const summaryInterval = setInterval(updateSummary, 10000); // Update every 10 seconds
      
      return () => {
        clearInterval(summaryInterval);
      };
    } else {
      marketContextService.stopAutoUpdate();
      setMarketContextSummary('');
    }
  }, [aiMode]);

  // Sync selected symbol with settings changes
  useEffect(() => {
    setSelectedSymbol(settings.defaultCrypto);
  }, [settings.defaultCrypto]);

  // Sync selected timeframe with settings changes
  useEffect(() => {
    setSelectedTimeframe(settings.defaultTimeframe);
  }, [settings.defaultTimeframe]);

  // Cleanup market context service on unmount
  useEffect(() => {
    return () => {
      marketContextService.cleanup();
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker(prev => !prev);
  }, []);

  const addToRecentEmojis = useCallback((emoji: string) => {
    setRecentEmojis(prev => {
      const newRecent = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 30);
      localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
      return newRecent;
    });
  }, []);

  const handleAiToggle = useCallback(() => {
    // Check permissions using new permissions system
    const hasAiAccess = canAccessAiChat();
    
    if (!hasAiAccess && !aiMode) {
      // User trying to enable AI but doesn't have permission
      addToast({
        type: 'error',
        message: 'You do not have permission to access AI Chat. Please contact an administrator.',
        senderName: 'System',
      });
      setShowAiWarning(true);
      setTimeout(() => setShowAiWarning(false), 3000); // Hide warning after 3 seconds
      return;
    }
    setAiMode(prev => !prev);
  }, [aiMode, canAccessAiChat, addToast]);

  const handleSymbolChange = useCallback((symbol: string) => {
    console.log(`📊 Switching symbol to: ${symbol}`);
    setSelectedSymbol(symbol);
    setShowSymbolDropdown(false);
    
    // Update settings to sync with the chart
    updateSettings({ defaultCrypto: symbol });
    
    // Force market context update with new symbol
    if (aiMode) {
      marketContextService.forceUpdate();
    }
  }, [updateSettings, aiMode]);

  const toggleSymbolDropdown = useCallback(() => {
    setShowSymbolDropdown(prev => !prev);
    setShowTimeframeDropdown(false); // Close timeframe dropdown when opening symbol
  }, []);

  const handleTimeframeChange = useCallback((timeframe: string) => {
    console.log(`📊 Switching timeframe to: ${timeframe}`);
    setSelectedTimeframe(timeframe);
    setShowTimeframeDropdown(false);
    
    // Update settings to sync with the chart
    updateSettings({ defaultTimeframe: timeframe });
    
    // Force market context update with new timeframe
    if (aiMode) {
      marketContextService.forceUpdate();
    }
  }, [updateSettings, aiMode]);

  const toggleTimeframeDropdown = useCallback(() => {
    setShowTimeframeDropdown(prev => !prev);
    setShowSymbolDropdown(false); // Close symbol dropdown when opening timeframe
  }, []);

  const toggleSettingsModal = useCallback(() => {
    setShowSettingsModal(prev => !prev);
    // Close any open dropdowns when opening modal
    setShowSymbolDropdown(false);
    setShowTimeframeDropdown(false);
    setShowEmojiPicker(false);
  }, []);

  const onEmojiClick = useCallback((emoji: string) => {
    setNewMessage(prev => prev + emoji);
    addToRecentEmojis(emoji);
    setShowEmojiPicker(false);
  }, [addToRecentEmojis]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load recent emojis from localStorage on component mount
  useEffect(() => {
    const savedRecentEmojis = localStorage.getItem('recentEmojis');
    if (savedRecentEmojis) {
      try {
        setRecentEmojis(JSON.parse(savedRecentEmojis));
      } catch (error) {
        console.error('Error loading recent emojis:', error);
      }
    }
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Close symbol dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (symbolDropdownRef.current && !symbolDropdownRef.current.contains(event.target as Node)) {
        setShowSymbolDropdown(false);
      }
    };

    if (showSymbolDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSymbolDropdown]);

  // Close timeframe dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeDropdownRef.current && !timeframeDropdownRef.current.contains(event.target as Node)) {
        setShowTimeframeDropdown(false);
      }
    };

    if (showTimeframeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimeframeDropdown]);

  // Emoji data organized by categories
  const emojiCategories = {
    recent: recentEmojis,
    smileys: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
      '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗'
    ],
    gestures: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
      '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝'
    ],
    hearts: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'
    ]
  };

  // Use global socket data and update local state accordingly
  const { connectionStatus: globalConnectionStatus, onlineUsers: globalOnlineUsers } = useSocket();

  useEffect(() => {
    setConnectionStatus(globalConnectionStatus);
  }, [globalConnectionStatus]);

  useEffect(() => {
    setOnlineUsers(globalOnlineUsers);
  }, [globalOnlineUsers, setOnlineUsers]);

  const sendAIMessage = useCallback(async () => {
    if (!newMessage.trim() || !user) return;

    const userMessage: Message = {
      id: `ai-user-${Date.now()}`,
      content: newMessage,
      senderId: user.id,
      senderName: user.name,
      createdAt: new Date(),
      messageType: 'text',
    };

    // Add user message to chat immediately
    setMessages(prev => [...prev, userMessage]);
    
    const prompt = newMessage;
    setNewMessage('');
    setIsTyping(false);

    try {
      // Dispatch OpenAI API call with market context
      const result = await dispatch(generateOpenAIResponse({ 
        prompt,
        systemMessage: "You are a helpful AI assistant in a cryptocurrency trading chat. Provide concise, helpful responses about trading, market analysis, or general questions. Keep responses under 150 words.",
        includeMarketContext: true // Include current chart context
      }));

      if (generateOpenAIResponse.fulfilled.match(result)) {
        // Add AI response message
        const aiMessage: Message = {
          id: `ai-response-${Date.now()}`,
          content: result.payload.message,
          senderId: 'ai-assistant',
          senderName: '🤖 AI Assistant',
          createdAt: new Date(),
          messageType: 'text',
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } else if (generateOpenAIResponse.rejected.match(result)) {
        // Handle error
        const errorMessage: Message = {
          id: `ai-error-${Date.now()}`,
          content: `❌ AI Error: ${result.payload || 'Failed to get AI response'}`,
          senderId: 'system',
          senderName: 'System',
          createdAt: new Date(),
          messageType: 'system',
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('❌ Error calling OpenAI:', error);
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        content: '❌ Failed to get AI response. Please try again.',
        senderId: 'system',
        senderName: 'System',
        createdAt: new Date(),
        messageType: 'system',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [newMessage, user, dispatch]);

  const sendMessage = useCallback(() => {
    // If AI mode is on, send to OpenAI instead of chat
    if (aiMode) {
      sendAIMessage();
      return;
    }

    console.log('📤 Send message called with:', { 
      message: newMessage,
      hasSocket: !!globalSocket, 
      hasUser: !!user,
      socketConnected: globalSocket?.connected
    });

    if (!newMessage.trim()) {
      console.log('❌ Message is empty');
      return;
    }

    if (!globalSocket) {
      console.log('❌ Socket not available');
      return;
    }

    if (!user) {
      console.log('❌ User not available');
      return;
    }

    if (!globalSocket?.connected) {
      console.log('❌ Socket not connected');
      return;
    }

    const messageData = {
      content: newMessage,
      messageType: 'text' as const,
    };

    console.log('📤 Emitting sendMessage event:', messageData);
    
    // Add message to UI immediately for better UX
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      senderId: user.id,
      senderName: user.name,
      createdAt: new Date(),
      messageType: 'text',
    };
    
    // Set timeout to remove temp message if not confirmed within 5 seconds
    setTimeout(() => {
      setMessages(prev => {
        const messageExists = prev.find(msg => 
          msg.id.startsWith('temp-') && 
          msg.content === tempMessage.content && 
          msg.senderId === tempMessage.senderId
        );
        
        if (messageExists) {
          console.log('⚠️ Removing unconfirmed temp message:', tempMessage.content);
          return prev.filter(msg => msg.id !== tempMessage.id);
        }
        return prev;
      });
    }, 5000);
    
    try {
      globalSocket.emit('sendMessage', messageData, (response: any) => {
        console.log('📤 Message send response:', response);
        if (response?.error) {
          console.error('❌ Error sending message:', response.error);
          // Remove temp message if there's an error
          setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        }
      });
      
      // Clear the input immediately for better UX
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('❌ Error emitting message:', error);
      // Remove temp message if there's an error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  }, [newMessage, globalSocket, user, aiMode, sendAIMessage]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!globalSocket) return;

    if (!isTyping) {
      setIsTyping(true);
      globalSocket?.emit('typing', { isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      globalSocket?.emit('typing', { isTyping: false });
    }, 1000);
  }, [globalSocket, isTyping]);

  const formatTime = useCallback((date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  const formatDate = useCallback((date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - messageDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return messageDate.toLocaleDateString([], { weekday: 'long' });
    } else {
      return messageDate.toLocaleDateString();
    }
  }, []);

     return (
     <div className={`w-full flex flex-col h-full max-h-full overflow-hidden ${
       isDarkMode 
         ? 'bg-gray-800 border-l border-gray-700' 
         : 'bg-white border-l border-gray-200'
     }`}>
             {/* Chat Header with Label and Settings */}
       <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
         <div className="flex justify-between items-center">
           {/* Chat Label with Status */}
           <div className="flex items-center space-x-2">
             <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
               {aiMode ? '🤖 AI Trading Chat' : '💬 Global Chat'}
             </h3>
             <div className="flex items-center space-x-1">
               <div className={`w-1.5 h-1.5 rounded-full ${
                 connectionStatus === 'connected' ? 'bg-green-400' :
                 connectionStatus === 'connecting' ? 'bg-yellow-400' :
                 connectionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
               }`}></div>
               <span className={`text-xs ${
                 connectionStatus === 'connected' ? 'text-green-400' : 
                 connectionStatus === 'connecting' ? 'text-yellow-400' :
                 'text-red-400'
               }`}>
                 {onlineUsers.length + 1}
               </span>
             </div>
           </div>
           
           {/* Settings Icon */}
           <button
             onClick={toggleSettingsModal}
             className={`p-1.5 rounded-lg transition-colors ${
               isDarkMode 
                 ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                 : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
             }`}
             title="Chat Settings"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
           </button>
         </div>

         {/* AI Market Context Summary */}
         {aiMode && marketContextSummary && (
           <div className={`mt-2 px-2 py-1 rounded text-xs ${
             isDarkMode ? 'bg-purple-900/20 text-purple-300' : 'bg-purple-50 text-purple-700'
           }`}>
             <div className="flex items-center space-x-1">
               <span>📊</span>
               <div className="truncate flex-1">{marketContextSummary}</div>
             </div>
           </div>
         )}

         {/* Typing Indicator */}
         {typingUsers.length > 0 && (
           <div className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
             {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
           </div>
         )}
       </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ 
          height: 'calc(100% - 140px)', // Chat header + input area
          minHeight: '200px'
        }}
      >
        {messages.map((message, index) => {
          const showDate = index === 0 || 
            new Date(message.createdAt).toDateString() !== 
            new Date(messages[index - 1]?.createdAt).toDateString();

          return (
            <div key={`${message.id}-${index}`}>
              {showDate && (
                <div className="text-center text-xs text-gray-500 my-2">
                  {formatDate(message.createdAt)}
                </div>
              )}
              <div className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg ${
                    message.messageType === 'system'
                      ? 'bg-yellow-600 text-white mx-auto'
                      : message.senderId === 'ai-assistant'
                      ? 'bg-purple-600 text-white border-l-4 border-purple-400'
                      : message.senderId === user?.id
                      ? message.id.startsWith('temp-') 
                        ? 'bg-blue-400 text-white opacity-75' // Temporary message styling
                        : 'bg-blue-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-200 text-gray-800'
                  }`}
                >
                 {message.messageType !== 'system' && (
                   <div className="text-xs font-medium mb-1">{message.senderName}</div>
                 )}
                 <div className="text-sm">{message.content}</div>
                 <div className="flex items-center justify-between text-xs opacity-75 mt-1">
                    <span>{formatTime(message.createdAt)}</span>
                    {message.id.startsWith('temp-') && (
                      <span className="ml-2 text-yellow-300">Sending...</span>
                    )}
                  </div>
               </div>
             </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-300'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Chat Settings
              </h3>
              <button
                onClick={toggleSettingsModal}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* AI Mode Toggle */}
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      AI Mode
                    </h4>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Enable AI-powered trading assistance
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={handleAiToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                        aiMode ? 'bg-blue-600' : 'bg-gray-600'
                      } ${!canAccessAiChat() ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          aiMode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    
                    {/* AI Permission Warning */}
                    {showAiWarning && (
                      <div className="absolute top-8 right-0 z-50 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        AI feature not available for your account
                        <div className="absolute -top-1 right-2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-red-600"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Connection Status
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Status:</span>
                    <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
                      {connectionStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Socket:</span>
                    <span className={globalSocket?.connected ? 'text-green-400' : 'text-red-400'}>
                      {globalSocket?.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>ID:</span>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {globalSocket?.id || 'None'}
                    </span>
                  </div>
                  {connectionStatus === 'error' && (
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Reconnect
                    </button>
                  )}
                </div>
              </div>

              {/* Online Users */}
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Online Users ({onlineUsers.length + 1})
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      You
                    </span>
                  </div>
                  {onlineUsers.map((onlineUser) => (
                    <div key={onlineUser.userId} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {onlineUser.userName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Settings - Only show when AI mode is enabled */}
              {aiMode && (
                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50 border border-purple-200'}`}>
                  <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    AI Configuration
                  </h4>
                  
                  {/* Trading Pair Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Trading Pair</span>
                      <div className="relative" ref={symbolDropdownRef}>
                        <button
                          onClick={toggleSymbolDropdown}
                          className={`flex items-center space-x-1 px-2 py-1 rounded text-xs border transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{cryptoOptions.find(opt => opt.value === selectedSymbol)?.symbol || 'DOGE'}</span>
                          <span className={`transition-transform duration-200 ${showSymbolDropdown ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showSymbolDropdown && (
                          <div className={`absolute top-full right-0 mt-1 w-40 rounded-lg shadow-lg border z-50 ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}>
                            <div className="py-1">
                              {cryptoOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleSymbolChange(option.value)}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                    selectedSymbol === option.value
                                      ? isDarkMode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-100 text-blue-700'
                                      : isDarkMode
                                        ? 'text-gray-300 hover:bg-gray-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{option.symbol}</span>
                                    <span className="text-xs opacity-75">{option.label.split(' / ')[1]}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeframe Selection */}
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Timeframe</span>
                      <div className="relative" ref={timeframeDropdownRef}>
                        <button
                          onClick={toggleTimeframeDropdown}
                          className={`flex items-center space-x-1 px-2 py-1 rounded text-xs border transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{timeframeOptions.find(opt => opt.value === selectedTimeframe)?.label || '5 Minutes'}</span>
                          <span className={`transition-transform duration-200 ${showTimeframeDropdown ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showTimeframeDropdown && (
                          <div className={`absolute top-full right-0 mt-1 w-32 rounded-lg shadow-lg border z-50 ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}>
                            <div className="py-1">
                              {timeframeOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleTimeframeChange(option.value)}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                    selectedTimeframe === option.value
                                      ? isDarkMode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-100 text-blue-700'
                                      : isDarkMode
                                        ? 'text-gray-300 hover:bg-gray-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Market Context Display */}
                    {marketContextSummary && (
                      <div className={`mt-3 p-2 rounded text-xs ${
                        isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'
                      }`}>
                        <div className="flex items-center space-x-1 mb-1">
                          <span>📊</span>
                          <span className="font-medium">Current Context:</span>
                        </div>
                        <div className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                          {marketContextSummary}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className={`p-4 border-t relative ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className={`absolute bottom-full left-4 mb-2 rounded-lg shadow-lg p-4 w-80 z-50 ${
              isDarkMode 
                ? 'bg-gray-800 border border-gray-600' 
                : 'bg-white border border-gray-300'
            }`}
          >
            <div className="mb-3">
              <div className="flex space-x-2 mb-2">
                {Object.keys(emojiCategories).map((category) => (
                  <button
                    key={category}
                    className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 capitalize"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {/* Recent Emojis */}
              {recentEmojis.length > 0 && (
                <div className="mb-4">
                  <h4 className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Recent</h4>
                  <div className="grid grid-cols-8 gap-1">
                    {recentEmojis.slice(0, 16).map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => onEmojiClick(emoji)}
                        className="p-2 hover:bg-gray-700 rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Smileys */}
              <div className="mb-4">
                <h4 className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Smileys</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojiCategories.smileys.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => onEmojiClick(emoji)}
                      className="p-2 hover:bg-gray-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Gestures */}
              <div className="mb-4">
                <h4 className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gestures</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojiCategories.gestures.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => onEmojiClick(emoji)}
                      className="p-2 hover:bg-gray-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Hearts */}
              <div>
                <h4 className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hearts</h4>
                <div className="grid grid-cols-8 gap-1">
                  {emojiCategories.hearts.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => onEmojiClick(emoji)}
                      className="p-2 hover:bg-gray-700 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={toggleEmojiPicker}
            className="text-yellow-400 hover:text-yellow-300 p-2 transition-colors duration-200"
            title="Add emoji"
          >
            😊
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={aiMode ? "Ask AI anything..." : "Type your message..."}
            className={`flex-1 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 text-sm ${
              aiMode 
                ? `bg-purple-700 text-white focus:ring-purple-500 border border-purple-600` 
                : isDarkMode
                  ? 'bg-gray-700 text-white focus:ring-blue-500'
                  : 'bg-gray-100 text-gray-900 focus:ring-blue-500 border border-gray-300'
            }`}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || (aiMode && aiLoading)}
            className={`px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
              aiMode
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {aiMode ? (aiLoading ? '🤖' : 'Ask AI') : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
