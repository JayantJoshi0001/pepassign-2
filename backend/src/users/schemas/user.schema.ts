import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class BusinessAddress {
  @Prop({ required: true })
  street!: string;

  @Prop()
  landmark?: string;

  @Prop({ required: true })
  city!: string;

  @Prop({ required: true })
  district!: string;

  @Prop({ required: true })
  state!: string;

  @Prop({ required: true })
  country!: string;

  @Prop({ required: true })
  pincode!: string;

  @Prop()
  latitude?: string;

  @Prop()
  longitude?: string;
}

export const BusinessAddressSchema =
  SchemaFactory.createForClass(BusinessAddress);

@Schema({ _id: false })
export class BusinessProfile {
  @Prop({ required: true })
  businessName!: string;

  @Prop({ type: BusinessAddressSchema, required: true })
  businessAddress!: BusinessAddress;

  @Prop({ required: true })
  businessDescription!: string;

  @Prop({ required: true })
  contactNumber!: string;

  @Prop({ type: [String], required: true })
  businessCategory!: string[];

  @Prop()
  websiteUrl?: string;

  @Prop()
  taxId?: string;

  @Prop()
  logo?: string;
}

export const BusinessProfileSchema =
  SchemaFactory.createForClass(BusinessProfile);

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  username!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: BusinessProfileSchema, default: undefined })
  businessProfile?: BusinessProfile;

  @Prop({ default: false })
  onboardingComplete!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
