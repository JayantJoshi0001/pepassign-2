import { Prop, Schema as NestSchema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export class Attachment {
  url!: string;
  name!: string;
  size!: number;
  mimeType!: string;
}

export const AttachmentSchema = new MongooseSchema({
  url: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
});

export class Message {
  senderRole!: 'buyer' | 'seller';
  senderId!: Types.ObjectId;
  body?: string;
  attachments?: Attachment[];
  timestamp!: Date;
  readAt?: Date;
  messageType!: string;
  status!: 'sent' | 'delivered' | 'read' | 'failed';
}

export const MessageSchema = new MongooseSchema({
  senderRole: { type: String, required: true, enum: ['buyer', 'seller'] },
  senderId: { type: Types.ObjectId, required: true, ref: 'User' },
  body: { type: String },
  attachments: { type: [AttachmentSchema], default: [] },
  timestamp: { type: Date, required: true, default: () => new Date() },
  readAt: { type: Date, default: undefined },
  messageType: { type: String, default: 'text' },
  status: { type: String, default: 'sent' },
});

@NestSchema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  participants!: Types.ObjectId[];

  @Prop({ type: [MessageSchema], default: [] })
  messages!: Message[];

  @Prop()
  lastMessage?: string;

  @Prop({ default: 0 })
  unreadCount?: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexing for fast retrieval by participants and recent activity
ConversationSchema.index({ buyerId: 1 });
ConversationSchema.index({ sellerId: 1 });
ConversationSchema.index({ productId: 1 });
ConversationSchema.index({ updatedAt: -1 });
