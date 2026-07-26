import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationCode(email: string, code: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '[Moiem] 이메일 인증번호 안내',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'Apple SD Gothic Neo', sans-serif; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #333333; margin-bottom: 20px;">이메일 인증 안내</h2>
            <p style="color: #666666; font-size: 15px; line-height: 1.5;">
              안녕하세요. Moiem 서비스 요청에 따라 이메일 인증번호를 발송합니다.<br/>
              아래의 6자리 인증번호를 입력하여 인증을 완료해 주세요.
            </p>
            <div style="background-color: #f4f4f6; padding: 20px; text-align: center; border-radius: 6px; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5;">${code}</span>
            </div>
            <p style="color: #999999; font-size: 13px;">
              * 본 인증번호는 <strong>3분간 유효</strong>합니다.<br/>
              * 본인이 요청한 것이 아니라면 이 메일을 무시하셔도 됩니다.
            </p>
          </div>
        `,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }
}
