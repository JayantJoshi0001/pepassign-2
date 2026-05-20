import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  @Transform(({ value }) => String(value).trim().toLowerCase())
  @IsEmail()
  @Matches(/^[a-z0-9._%+-]+@gmail\.com$/, {
    message: 'Email must be a Gmail address.',
  })
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}
