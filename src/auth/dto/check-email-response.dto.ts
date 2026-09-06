import { ApiProperty } from '@nestjs/swagger';

export class CheckEmailResponseDto {
  @ApiProperty({ example: true, description: '가입 가능 여부 (true: 사용 가능, false: 이미 사용 중)' })
  isAvailable: boolean;
}
