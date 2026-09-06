import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f60718293a4b5c6d7e8f90...',
    description: '로그인/갱신 시 발급받은 리프레시 토큰',
  })
  @IsString()
  refreshToken: string;
}
