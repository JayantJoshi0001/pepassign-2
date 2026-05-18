import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() credentials: LoginDto): LoginResponseDto {
    return this.authService.login(credentials);
  }

  @Post('register')
  register(@Body() credentials: RegisterDto): LoginResponseDto {
    return this.authService.register(credentials);
  }
}
