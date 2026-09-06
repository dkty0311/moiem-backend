import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: '요청이 성공적으로 처리되었습니다.', description: '결과 메시지' })
  message: string;
}
