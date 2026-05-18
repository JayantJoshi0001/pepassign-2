import { ConflictException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export interface UserRecord {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
}

@Injectable()
export class UsersService implements OnModuleInit, OnModuleDestroy {
  private readonly database: DatabaseSync;

  constructor(private readonly configService: ConfigService) {
    const databasePath = this.resolveDatabasePath();
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
  }

  onModuleInit(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  onModuleDestroy(): void {
    this.database.close();
  }

  createUser(username: string, password: string): UserRecord {
    if (this.findByUsername(username)) {
      throw new ConflictException('Username already exists.');
    }

    const passwordHash = this.hashPassword(password);
    const insertStatement = this.database.prepare(
      'INSERT INTO users (username, passwordHash) VALUES (?, ?)',
    );
    insertStatement.run(username, passwordHash);

    const createdUser = this.findByUsername(username);

    if (!createdUser) {
      throw new ConflictException('Unable to create user.');
    }

    return createdUser;
  }

  findByUsername(username: string): UserRecord | undefined {
    const query = this.database.prepare(
      'SELECT id, username, passwordHash, createdAt FROM users WHERE username = ?',
    );

    return query.get(username) as UserRecord | undefined;
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

  private resolveDatabasePath(): string {
    const configuredPath = this.configService.get<string>('DATABASE_PATH') ?? './data/auth.db';
    return isAbsolute(configuredPath)
      ? configuredPath
      : resolve(process.cwd(), configuredPath);
  }
}
