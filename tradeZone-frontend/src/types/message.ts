export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  roomId?: string;
  createdAt: Date;
  updatedAt?: Date;
  messageType: 'text' | 'image' | 'file' | 'system';
}
