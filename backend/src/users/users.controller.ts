import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { UsersService } from './users.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() request: AuthenticatedRequest) {
    const user = await this.usersService.findById(request.user.userId);
    return {
      id: user?.id,
      username: user?.username,
      email: user?.email,
      onboardingComplete: user?.onboardingComplete ?? false,
      businessProfile: user?.businessProfile ?? null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/business')
  async completeBusinessProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: UpdateBusinessProfileDto,
  ) {
    const user = await this.usersService.updateBusinessProfile(
      request.user.userId,
      body,
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      onboardingComplete: user.onboardingComplete,
      businessProfile: user.businessProfile ?? null,
    };
  }
}
