import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT 액세스 토큰 (15분 유효)' })
  accessToken: string;

  @ApiProperty({ example: 'a1b2c3d4e5f60718293a4b5c6d7e8f90...', description: '리프레시 토큰 (7일 유효)' })
  refreshToken: string;
}
