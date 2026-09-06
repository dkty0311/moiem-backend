import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CheckEmailResponseDto } from './dto/check-email-response.dto';
import { CheckEmailDto } from './dto/check-email.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('email/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증번호 발송' })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: '인증번호 발송 성공 (3분간 유효)',
  })
  @ApiConflictResponse({ description: '이미 가입된 이메일인 경우' })
  sendVerificationCode(@Body() dto: SendVerificationDto) {
    return this.authService.sendVerificationCode(dto.email);
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 인증번호 검증' })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: '이메일 인증 성공',
  })
  @ApiBadRequestResponse({ description: '인증번호 불일치 또는 인증시간(3분) 만료' })
  @ApiNotFoundResponse({ description: '인증 요청 내역이 없음 (먼저 발송 필요)' })
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.email, dto.code);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiCreatedResponse({
    type: UserResponseDto,
    description: '회원가입 성공 시 생성된 유저 프로필 정보 반환',
  })
  @ApiConflictResponse({ description: '이미 사용 중인 이메일인 경우' })
  @ApiBadRequestResponse({ description: '이메일 미인증 상태이거나 입력 형식 오류' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('email-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '이메일 중복 체크' })
  @ApiOkResponse({
    type: CheckEmailResponseDto,
    description: '이메일 사용 가능 여부 (isAvailable: true/false)',
  })
  checkEmail(@Body() dto: CheckEmailDto) {
    return this.authService.checkEmail(dto.email);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiOkResponse({
    type: LoginResponseDto,
    description: '로그인 성공 (액세스/리프레시 토큰 및 유저 프로필 반환)',
  })
  @ApiUnauthorizedResponse({ description: '이메일 또는 비밀번호 불일치' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: '액세스 토큰 갱신' })
  @ApiOkResponse({
    type: TokenResponseDto,
    description: '액세스/리프레시 토큰 재발급 성공',
  })
  @ApiUnauthorizedResponse({ description: '유효하지 않거나 만료된 리프레시 토큰' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: '로그아웃' })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: '로그아웃 성공 및 리프레시 토큰 무효화',
  })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiOkResponse({
    type: UserResponseDto,
    description: '현재 로그인한 유저 프로필 정보',
  })
  @ApiUnauthorizedResponse({ description: '로그인 인증이 필요하거나 토큰 만료' })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  @Patch('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiOkResponse({
    type: MessageResponseDto,
    description: '비밀번호 변경 성공 (기존 세션 만료 및 재로그인 필요)',
  })
  @ApiBadRequestResponse({ description: '현재 비밀번호 불일치 또는 새 비밀번호가 기존과 동일한 경우' })
  @ApiUnauthorizedResponse({ description: '로그인 인증이 필요하거나 토큰 만료' })
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, dto);
  }
}
