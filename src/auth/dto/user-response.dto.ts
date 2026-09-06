import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'c7a8b9e0-1234-5678-9abc-def012345678', description: '유저 고유 ID (UUID)' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  email: string;

  @ApiPropertyOptional({ example: '홍길동', description: '이름' })
  name?: string | null;

  @ApiPropertyOptional({ example: '모임장', description: '닉네임' })
  nickname?: string | null;

  @ApiPropertyOptional({ example: '안녕하세요! 모임을 즐기는 개발자입니다.', description: '한줄소개' })
  bio?: string | null;

  @ApiPropertyOptional({
    example: '/uploads/profiles/1725608000-123456789.png',
    description: '프로필 이미지 URL',
  })
  profileImageUrl?: string | null;

  @ApiPropertyOptional({
    example: ['러닝/운동', '독서/스터디'],
    type: [String],
    description: '좋아하는 모임 카테고리 목록',
  })
  favoriteCategories?: any;

  @ApiPropertyOptional({ example: '역삼동', description: '활동지역 (동)' })
  dong?: string | null;

  @ApiPropertyOptional({ example: 37.4979, description: '활동지역 위도' })
  latitude?: number | null;

  @ApiPropertyOptional({ example: 127.0276, description: '활동지역 경도' })
  longitude?: number | null;

  @ApiProperty({ enum: Role, example: Role.USER, description: '권한' })
  role: Role;

  @ApiProperty({ example: '2026-09-06T06:20:00.000Z', description: '가입일시' })
  createdAt: Date;
}
