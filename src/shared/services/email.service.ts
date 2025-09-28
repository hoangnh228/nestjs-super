import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import env from 'src/shared/config'
import OtpEmail from 'emails/otp'

// const template = fs.readFileSync(path.resolve('src/shared/email-templates/otp.html'), 'utf8')
@Injectable()
export class EmailService {
  private readonly resend: Resend
  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY)
  }

  sendOtp(payload: { email: string; code: string }) {
    return this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'hoangnh228@gmail.com',
      subject: 'Your OTP code',
      react: OtpEmail({ subject: 'Your OTP code', verificationCode: payload.code }),
      // html: template.replaceAll('{{code}}', payload.code).replaceAll('{{subject}}', 'Your OTP code'),
    })
  }
}
