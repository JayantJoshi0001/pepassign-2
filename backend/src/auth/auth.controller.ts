import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() credentials: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(credentials);
  }

  @Post('register')
  async register(@Body() credentials: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(credentials);
  }
}
