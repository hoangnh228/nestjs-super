import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import env from 'src/shared/config'

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
      html: `Your OTP code is ${payload.code}`,
    })
  }
}
