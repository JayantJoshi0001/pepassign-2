import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { User } from './schemas/user.schema';

export interface BusinessAddressRecord {
  street: string;
  landmark?: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: string;
  longitude?: string;
}

export interface BusinessProfileRecord {
  businessName: string;
  businessAddress: BusinessAddressRecord;
  businessDescription: string;
  contactNumber: string;
  businessCategory: string[];
  websiteUrl?: string;
  taxId?: string;
  logo?: string;
}

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  onboardingComplete: boolean;
  businessProfile?: BusinessProfileRecord;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(credentials: RegisterDto): Promise<UserRecord> {
    const normalizedEmail = credentials.email.trim().toLowerCase();
    const existingUser = await this.userModel.findOne({
      $or: [{ username: credentials.username }, { email: normalizedEmail }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists.');
    }

    const passwordHash = this.hashPassword(credentials.password);

    try {
      const createdUser = await this.userModel.create({
        username: credentials.username,
        email: normalizedEmail,
        passwordHash,
      });
      return this.toUserRecord(createdUser);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Username or email already exists.');
      }

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
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: (user as any).createdAt,
      onboardingComplete: user.onboardingComplete,
      businessProfile: user.businessProfile
        ? {
            businessName: user.businessProfile.businessName,
            businessAddress: {
              street: user.businessProfile.businessAddress.street,
              landmark: user.businessProfile.businessAddress.landmark,
              city: user.businessProfile.businessAddress.city,
              district: user.businessProfile.businessAddress.district,
              state: user.businessProfile.businessAddress.state,
              country: user.businessProfile.businessAddress.country,
              pincode: user.businessProfile.businessAddress.pincode,
              latitude: user.businessProfile.businessAddress.latitude,
              longitude: user.businessProfile.businessAddress.longitude,
            },
            businessDescription: user.businessProfile.businessDescription,
            contactNumber: user.businessProfile.contactNumber,
            businessCategory: [...user.businessProfile.businessCategory],
            websiteUrl: user.businessProfile.websiteUrl,
            taxId: user.businessProfile.taxId,
            logo: user.businessProfile.logo,
          }
        : undefined,
    };
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    const user = await this.userModel.findById(id).exec();

    if (!user) {
      return undefined;
    }

    return this.toUserRecord(user);
  }

  async updateBusinessProfile(
    userId: string,
    profile: UpdateBusinessProfileDto,
  ): Promise<UserRecord> {
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new ConflictException('User not found.');
    }

    user.businessProfile = {
      businessName: profile.businessName.trim(),
      businessAddress: {
        street: profile.businessAddress.street.trim(),
        landmark: profile.businessAddress.landmark?.trim(),
        city: profile.businessAddress.city.trim(),
        district: profile.businessAddress.district.trim(),
        state: profile.businessAddress.state.trim(),
        country: profile.businessAddress.country.trim(),
        pincode: profile.businessAddress.pincode.trim(),
        latitude: profile.businessAddress.latitude?.trim(),
        longitude: profile.businessAddress.longitude?.trim(),
      },
      businessDescription: profile.businessDescription.trim(),
      contactNumber: profile.contactNumber.trim(),
      businessCategory: profile.businessCategory
        .map((category) => category.trim())
        .filter(Boolean),
      websiteUrl: profile.websiteUrl?.trim(),
      taxId: profile.taxId?.trim(),
      logo: profile.logo?.trim(),
    };
    user.onboardingComplete = true;

    await user.save();

    return this.toUserRecord(user);
  }

  async searchSuppliers(
    searchRegex: RegExp,
  ): Promise<
    Array<{
      id: string;
      businessName: string;
      businessDescription?: string;
      businessCategory?: string[];
      city?: string;
      country?: string;
      logo?: string;
      contactNumber?: string;
    }>
  > {
    const users = await this.userModel
      .find({
        onboardingComplete: true,
        $or: [
          { 'businessProfile.businessName': searchRegex },
          { 'businessProfile.businessDescription': searchRegex },
        ],
      })
      .exec();

    return users
      .filter((user) => user.businessProfile)
      .map((user) => ({
        id: user._id.toString(),
        businessName: user.businessProfile!.businessName,
        businessDescription: user.businessProfile?.businessDescription,
        businessCategory: user.businessProfile?.businessCategory,
        city: user.businessProfile?.businessAddress?.city,
        country: user.businessProfile?.businessAddress?.country,
        logo: user.businessProfile?.logo,
        contactNumber: user.businessProfile?.contactNumber,
      }));
  }

  verifyPassword(password: string, passwordHash: string): boolean {
    const [salt, derivedHash] = passwordHash.split(':');

    if (!salt || !derivedHash) {
      return false;
    }

    const expectedBuffer = Buffer.from(derivedHash, 'hex');
    const actualBuffer = scryptSync(
      password,
      salt,
      expectedBuffer.length,
    ) as Buffer;

    return (
      expectedBuffer.length === actualBuffer.length &&
      timingSafeEqual(expectedBuffer, actualBuffer)
    );
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedHash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derivedHash}`;
  }

  private toUserRecord(user: User): UserRecord {
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: (user as any).createdAt,
      onboardingComplete: user.onboardingComplete,
      businessProfile: user.businessProfile
        ? {
            businessName: user.businessProfile.businessName,
            businessAddress: {
              street: user.businessProfile.businessAddress.street,
              landmark: user.businessProfile.businessAddress.landmark,
              city: user.businessProfile.businessAddress.city,
              district: user.businessProfile.businessAddress.district,
              state: user.businessProfile.businessAddress.state,
              country: user.businessProfile.businessAddress.country,
              pincode: user.businessProfile.businessAddress.pincode,
              latitude: user.businessProfile.businessAddress.latitude,
              longitude: user.businessProfile.businessAddress.longitude,
            },
            businessDescription: user.businessProfile.businessDescription,
            contactNumber: user.businessProfile.contactNumber,
            businessCategory: [...user.businessProfile.businessCategory],
            websiteUrl: user.businessProfile.websiteUrl,
            taxId: user.businessProfile.taxId,
            logo: user.businessProfile.logo,
          }
        : undefined,
    };
  }
}
