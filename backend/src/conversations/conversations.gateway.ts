import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  WebSocketGateway,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ConversationsService } from './conversations.service';

interface AuthTokenPayload {
  sub: string;
}

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ws' })
export class ConversationsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConversationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly conversationsService: ConversationsService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('ConversationsGateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      let token = client.handshake.auth?.token as string | undefined;
      // fallback: read token from cookie header (Next.js sets httpOnly cookie)
      if (
        !token &&
        client.handshake.headers &&
        client.handshake.headers.cookie
      ) {
        const cookie = client.handshake.headers.cookie;
        const match = cookie.match(/pepassign_access_token=([^;\s]+)/);
        if (match) token = decodeURIComponent(match[1]);
      }
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<AuthTokenPayload>(token);
      const userId = payload.sub;
      // attach user id to socket
      (client as any).userId = userId;
      this.logger.log(`Socket connected user=${userId} id=${client.id}`);
    } catch (err) {
      this.logger.warn('Socket auth failed', (err as Error).message);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected ${client.id}`);
  }

  @SubscribeMessage('join:conversation')
  async onJoinConversation(
    @MessageBody() payload: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).userId as string | undefined;
    if (!userId) return;
    const room = `conversation:${payload.conversationId}`;
    client.join(room);
    this.logger.log(`User ${userId} joined ${room}`);
  }

  @SubscribeMessage('leave:conversation')
  async onLeaveConversation(
    @MessageBody() payload: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation:${payload.conversationId}`;
    client.leave(room);
  }

  @SubscribeMessage('message:create')
  async onMessageCreate(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).userId as string | undefined;
    if (!userId) return;

    const { conversationId, message } = payload;

    // persist
    const saved = await this.conversationsService.addMessage(conversationId, {
      senderId: userId,
      senderRole: message.senderRole,
      body: message.body,
      attachments: message.attachments ?? [],
      messageType: message.messageType ?? 'text',
    });

    const room = `conversation:${conversationId}`;
    // broadcast to room
    this.server
      .to(room)
      .emit('message:created', { conversationId, message: saved });
  }

  @SubscribeMessage('typing')
  onTyping(
    @MessageBody() payload: { conversationId: string; typing: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `conversation:${payload.conversationId}`;
    this.server.to(room).emit('typing', {
      conversationId: payload.conversationId,
      typing: payload.typing,
      userId: (client as any).userId,
    });
  }
}
