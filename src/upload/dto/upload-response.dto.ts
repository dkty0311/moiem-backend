import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: '1725608000-123456789.png', description: '저장된 파일명' })
  filename: string;

  @ApiProperty({ example: 'profile.png', description: '업로드된 원본 파일명' })
  originalName: string;

  @ApiProperty({ example: 245012, description: '파일 크기 (Byte)' })
  size: number;

  @ApiProperty({ example: 'image/png', description: '파일 MIME 타입' })
  mimetype: string;

  @ApiProperty({
    example: '/uploads/profiles/1725608000-123456789.png',
    description: '상대 경로 (DB 저장용)',
  })
  url: string;

  @ApiProperty({
    example: 'http://localhost:3000/uploads/profiles/1725608000-123456789.png',
    description: '접근 가능한 전체 URL',
  })
  fullUrl: string;
}
