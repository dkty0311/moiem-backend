import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'currentPass123', minLength: 8, description: '현재 비밀번호' })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({ example: 'newPass456!', minLength: 8, description: '변경할 새 비밀번호' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
