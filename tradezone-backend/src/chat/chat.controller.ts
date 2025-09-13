import { Controller, Get } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Chat controller simplified - all chat operations handled via WebSocket Gateway
  // Database-based REST endpoints removed since chat is in-memory via WebSocket

  @Get('status')
  async getChatStatus() {
    return this.chatService.getServiceStatus();
  }
}
