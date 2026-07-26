import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendVerificationDto {
  @ApiProperty({ example: 'user@example.com', description: '인증번호를 발송할 이메일' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일을 입력해 주세요.' })
  email: string;
}
