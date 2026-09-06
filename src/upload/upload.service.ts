import { BadRequestException, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Request } from 'express';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'profiles');

  constructor() {
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  formatFileResponse(file: Express.Multer.File, req: Request) {
    if (!file) {
      throw new BadRequestException('업로드할 파일이 없습니다.');
    }

    const serverUrl = process.env.SERVER_URL?.replace(/\/$/, '');
    const relativeUrl = `/uploads/profiles/${file.filename}`;

    let fullUrl: string;
    if (serverUrl) {
      fullUrl = `${serverUrl}${relativeUrl}`;
    } else {
      const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol;
      const host = req.get('host') ?? 'localhost:3000';
      fullUrl = `${protocol}://${host}${relativeUrl}`;
    }

    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: relativeUrl,
      fullUrl: fullUrl,
    };
  }
}
