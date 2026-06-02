export interface CreateConversationDto {
  buyerId: string;
  sellerId: string;
  productId: string;
  initialMessage?: {
    body?: string;
    messageType?: string;
  };
}
