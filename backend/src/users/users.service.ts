import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import { User } from './schemas/user.schema';

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(username: string, password: string): Promise<UserRecord> {
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists.');
    }

    const passwordHash = this.hashPassword(password);
    
    try {
      const createdUser = await this.userModel.create({ username, passwordHash });
      return {
        id: createdUser._id.toString(),
        username: createdUser.username,
        passwordHash: createdUser.passwordHash,
        createdAt: (createdUser as any).createdAt,
      };
    } catch (error) {
      throw new ConflictException('Unable to create user.');
    }
  }

  async findByUsername(username: string): Promise<UserRecord | undefined> {
    const user = await this.userModel.findOne({ username }).exec();
    if (!user) {
      return undefined;
    }
    return {
      id: user._id.toString(),
      username: user.username,
      passwordHash: user.passwordHash,
      createdAt: (user as any).createdAt,
    };
  }

  verifyPassword(password: string, passwordHash: string): boolean {
    const [salt, derivedHash] = passwordHash.split(':');

    if (!salt || !derivedHash) {
      return false;
    }

    const expectedBuffer = Buffer.from(derivedHash, 'hex');
    const actualBuffer = scryptSync(password, salt, expectedBuffer.length) as Buffer;

    return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedHash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedHash}`;
  }
}
