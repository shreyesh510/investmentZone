import { Injectable } from '@nestjs/common';

// Simplified ChatService - all chat operations now handled via WebSocket Gateway
// Database operations removed since chat is in-memory for real-time performance

@Injectable()
export class ChatService {
  // Chat service simplified - all real-time chat operations handled via WebSocket Gateway
  // No database persistence needed for chat messages (using in-memory storage)

  getServiceStatus() {
    return {
      status: 'active',
      mode: 'websocket-only',
      persistence: false,
      message:
        'Chat service active - all operations handled via WebSocket Gateway',
    };
  }
}
