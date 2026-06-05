import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ConversationsService } from './conversations.service';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { SendMessageDto } from './dto/send-message.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Request() req: any) {
    const userId = req.user.userId as string;
    return this.conversationsService.listUserConversations(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() body: CreateConversationDto) {
    // Ensure buyerId matches authenticated user when creating an RFQ
    const userId = req.user.userId as string;
    if (body.buyerId !== userId) {
      body.buyerId = userId;
    }

    return this.conversationsService.createOrGetConversation(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.conversationsService.getConversation(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/messages')
  async sendMessage(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
  ) {
    const userId = req.user.userId as string;
    // ensure senderId matches authenticated user
    if (body.senderId !== userId) {
      body.senderId = userId;
    }

    return this.conversationsService.addMessage(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/messages')
  async getMessages(@Request() req: any, @Param('id') id: string) {
    // Read query params from the request object
    const query = req.query ?? {};
    const before = query.before ? new Date(query.before as string) : undefined;
    const limit = query.limit ? parseInt(query.limit as string, 10) : 50;

    return this.conversationsService.getMessages(id, before, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'conversations');
          if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const safeExt = extname(file.originalname).toLowerCase();
          const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (req, file, cb) => {
        const allowed = [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
        ];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAttachment(
    @Request() req: any,
    @Param('id') conversationId: string,
    @UploadedFile() file: any,
  ) {
    const userId = req.user.userId as string;

    if (!file) throw new BadRequestException('No file uploaded');

    // return attachment metadata; URL served via GET /conversations/files/:name
    const url = `/conversations/files/${file.filename}`;

    return {
      url,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('files/:name')
  async serveFile(
    @Request() req: any,
    @Param('name') name: string,
    @Res() res: Response,
  ) {
    // ensure requester is a participant of the conversation referencing this file
    const userId = req.user.userId as string;
    const hasAccess = await this.conversationsService.userHasAccessToFile(
      userId,
      name,
    );
    if (!hasAccess) {
      return res.status(403).send('Forbidden');
    }

    const filePath = join(process.cwd(), 'uploads', 'conversations', name);
    return res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteConversation(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId as string;
    return this.conversationsService.deleteConversation(userId, id);
  }
}
