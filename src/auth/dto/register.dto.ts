import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8, description: '비밀번호 (8자 이상)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '모임장', minLength: 2, maxLength: 20, description: '닉네임 (2~20자)' })
  @IsString()
  @Length(2, 20)
  nickname: string;

  @ApiPropertyOptional({ example: '홍길동', description: '이름 (선택, 미입력 시 닉네임 사용)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '안녕하세요! 모임을 즐기는 개발자입니다.', maxLength: 200, description: '한줄소개' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://example.com/profile.jpg', description: '프로필 이미지 URL' })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiPropertyOptional({
    example: ['러닝/운동', '독서/스터디'],
    type: [String],
    description: '좋아하는 모임 카테고리 목록',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteCategories?: string[];

  @ApiPropertyOptional({ example: '역삼동', description: '활동지역 (동 이름)' })
  @IsOptional()
  @IsString()
  dong?: string;

  @ApiPropertyOptional({ example: 37.4979, description: '활동지역 위도' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 127.0276, description: '활동지역 경도' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
