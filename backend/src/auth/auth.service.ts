import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(credentials: LoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByUsername(credentials.username);

    if (
      !user ||
      !this.usersService.verifyPassword(credentials.password, user.passwordHash)
    ) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    const accessToken = this.jwtService.sign({ sub: user.id });

    return {
      accessToken,
      username: user.username,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
    };
  }

  async register(credentials: RegisterDto): Promise<LoginResponseDto> {
    const createdUser = await this.usersService.createUser(credentials);

    const accessToken = this.jwtService.sign({ sub: createdUser.id });

    return {
      accessToken,
      username: createdUser.username,
      email: createdUser.email,
      onboardingComplete: createdUser.onboardingComplete,
    };
  }
}
