export interface AttachmentDto {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface SendMessageDto {
  senderRole: 'buyer' | 'seller';
  senderId: string;
  body?: string;
  attachments?: AttachmentDto[];
  messageType?: string;
}
