import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { ConversationArchive, ConversationArchiveSchema } from './schemas/conversation-archive.schema';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { ConversationsGateway } from './conversations.gateway';
import { AuthModule } from '../auth/auth.module';
import { ArchivalService } from './archival.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: ConversationArchive.name, schema: ConversationArchiveSchema },
    ]),
    AuthModule,
  ],
  providers: [ConversationsService, ConversationsGateway, ArchivalService],
  controllers: [ConversationsController],
  exports: [ConversationsService],
})
export class ConversationsModule {}
