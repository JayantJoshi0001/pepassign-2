import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { ConversationArchive } from './schemas/conversation-archive.schema';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

const MAX_MESSAGES = 2000;
const KEEP_MESSAGES = 500;

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(ConversationArchive.name)
    private readonly archiveModel: Model<ConversationArchive>,
  ) {}

  async createOrGetConversation(dto: CreateConversationDto) {
    const { buyerId, sellerId, productId, initialMessage } = dto;

    const existing = await this.conversationModel
      .findOne({ buyerId, sellerId, productId })
      .exec();

    if (existing) return existing;

    const conv = new this.conversationModel({
      buyerId: new Types.ObjectId(buyerId),
      sellerId: new Types.ObjectId(sellerId),
      productId: new Types.ObjectId(productId),
      participants: [new Types.ObjectId(buyerId), new Types.ObjectId(sellerId)],
      messages: [],
      unreadCount: 0,
    });

    conv.messages ??= [];

    if (initialMessage?.body) {
      conv.messages.push({
        senderRole: 'buyer',
        senderId: new Types.ObjectId(buyerId),
        body: initialMessage.body,
        timestamp: new Date(),
        messageType: initialMessage.messageType ?? 'text',
        status: 'sent',
      } as any);
      conv.lastMessage = initialMessage.body;
      conv.unreadCount = 1;
    }

    await conv.save();
    return conv;
  }

  async addMessage(conversationId: string, message: SendMessageDto) {
    const conv = await this.conversationModel.findById(conversationId).exec();
    if (!conv) {
      throw new NotFoundException('Conversation not found.');
    }

    const msg: any = {
      senderRole: message.senderRole,
      senderId: new Types.ObjectId(message.senderId),
      body: message.body,
      attachments: message.attachments ?? [],
      timestamp: new Date(),
      messageType: message.messageType ?? 'text',
      status: 'sent',
    };

    conv.messages.push(msg);
    conv.lastMessage = message.body ?? '';
    conv.unreadCount = (conv.unreadCount ?? 0) + 1;

    await conv.save();

    // schedule archival if necessary (do not await)
    if ((conv.messages?.length ?? 0) > MAX_MESSAGES) {
      this.archiveConversationIfNeeded(conv._id.toString()).catch((err) =>
        this.logger.error('Archival failed', err),
      );
    }

    return msg;
  }

  async getMessages(conversationId: string, before?: Date, limit = 50) {
    // Use aggregation to unwind messages and return paginated results
    const matchStage: any = { _id: new Types.ObjectId(conversationId) };

    const pipeline: any[] = [
      { $match: matchStage },
      { $unwind: '$messages' },
    ];

    if (before) pipeline.push({ $match: { 'messages.timestamp': { $lt: before } } });

    pipeline.push({ $sort: { 'messages.timestamp': -1 } });
    pipeline.push({ $limit: limit });
    pipeline.push({ $replaceRoot: { newRoot: '$messages' } });

    const results = await this.conversationModel.aggregate(pipeline).exec();

    // return in chronological order
    return results.reverse();
  }

  async userHasAccessToFile(userId: string, filename: string) {
    const objId = new Types.ObjectId(userId);
    const safeFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const urlPattern = new RegExp(
      `(?:/conversations/files/|/api/conversations/files/)${safeFilename}$`,
    );
    const conv = await this.conversationModel
      .findOne({ participants: objId, 'messages.attachments.url': urlPattern })
      .exec();
    return !!conv;
  }

  private async archiveConversationIfNeeded(conversationId: string) {
    const conv = await this.conversationModel.findById(conversationId).exec();
    if (!conv) return;

    const len = conv.messages?.length ?? 0;
    if (len <= MAX_MESSAGES) return;

    const numberToArchive = len - KEEP_MESSAGES;
    if (numberToArchive <= 0) return;

    const messagesToArchive = conv.messages.slice(0, numberToArchive);

    await this.archiveModel.create({
      conversationId: conv._id,
      messages: messagesToArchive,
    });

    // remove archived messages and keep recent ones
    conv.messages = conv.messages.slice(numberToArchive);
    await conv.save();

    this.logger.log(
      `Archived ${numberToArchive} messages from conversation ${conversationId}`,
    );
  }

  async getConversation(conversationId: string) {
    const conv = await this.conversationModel
      .findById(conversationId)
      .populate('buyerId')
      .populate('sellerId')
      .populate('productId')
      .exec();
    if (!conv) throw new NotFoundException('Conversation not found.');
    return conv;
  }

  async listUserConversations(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const convs = await this.conversationModel
      .find({ participants: userObjId })
      .sort({ updatedAt: -1 })
      .populate('productId')
      .exec();

    // Map to a lightweight DTO with product name and last message timestamp
    return convs.map((conv) => {
      const updatedAt = (conv as any).updatedAt as Date | undefined;
      const lastMsg = (conv.messages ?? []).length
        ? conv.messages[conv.messages.length - 1]
        : undefined;

      const lastMessageAt = lastMsg?.timestamp ?? updatedAt ?? undefined;

      const productName = (conv.productId && (conv.productId as any).productName) || undefined;

      return {
        _id: conv._id,
        productName,
        lastMessage: conv.lastMessage ?? (lastMsg ? lastMsg.body : ''),
        lastMessageAt,
        unreadCount: conv.unreadCount ?? 0,
        updatedAt,
      };
    });
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conv = await this.conversationModel.findById(conversationId).exec();
    if (!conv) throw new NotFoundException('Conversation not found.');

    const objUser = new Types.ObjectId(userId);
    const isParticipant = (conv.participants ?? []).some((p: any) => p.equals(objUser));
    if (!isParticipant) throw new NotFoundException('Conversation not found.');

    // remove conversation and any archives
    await this.conversationModel.deleteOne({ _id: conv._id }).exec();
    await this.archiveModel.deleteMany({ conversationId: conv._id }).exec();

    return { success: true };
  }
}
