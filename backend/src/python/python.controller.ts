import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessageDto } from './dto/message.dto';
import { PythonService } from './python.service';

interface AuthenticatedRequest extends Request {
  user: {
    username: string;
  };
}

@Controller('python')
export class PythonController {
  constructor(private readonly pythonService: PythonService) {}

  @Post('talk')
  @UseGuards(JwtAuthGuard)
  async talk(
    @Req() request: AuthenticatedRequest,
    @Body() payload: MessageDto,
  ): Promise<{ username: string; response: string }> {
    const response = await this.pythonService.talk(payload.text);

    return {
      username: request.user.username,
      response,
    };
  }
}
