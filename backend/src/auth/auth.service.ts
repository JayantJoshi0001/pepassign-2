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

  login(credentials: LoginDto): LoginResponseDto {
    const user = this.usersService.findByUsername(credentials.username);

    if (!user || !this.usersService.verifyPassword(credentials.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    const accessToken = this.jwtService.sign({ sub: user.username });

    return {
      accessToken,
      username: user.username,
    };
  }

  register(credentials: RegisterDto): LoginResponseDto {
    const createdUser = this.usersService.createUser(
      credentials.username,
      credentials.password,
    );

    const accessToken = this.jwtService.sign({ sub: createdUser.username });

    return {
      accessToken,
      username: createdUser.username,
    };
  }
}
