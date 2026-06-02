import { Prop, Schema as NestSchema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@NestSchema({ timestamps: true })
export class ConversationArchive extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId!: Types.ObjectId;

  @Prop({ type: [Object], required: true })
  messages!: any[];
}

export const ConversationArchiveSchema = SchemaFactory.createForClass(ConversationArchive);
