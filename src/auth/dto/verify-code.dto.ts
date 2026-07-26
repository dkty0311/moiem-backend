import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력해 주세요.' })
  email: string;

  @ApiProperty({ example: '123456', description: '6자리 인증코드' })
  @IsString()
  @Length(6, 6, { message: '인증코드는 6자리 숫자여야 합니다.' })
  code: string;
}
