import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import env from 'src/shared/config'
import fs from 'fs'
import path from 'path'

const template = fs.readFileSync(path.resolve('src/shared/email-templates/otp.html'), 'utf8')
@Injectable()
export class EmailService {
  private readonly resend: Resend
  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY)
  }

  sendOtp(payload: { email: string; code: string }) {
    console.log('here')
    return this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'hoangnh228@gmail.com',
      subject: 'Your OTP code',
      html: template.replaceAll('{{code}}', payload.code).replaceAll('{{subject}}', 'Your OTP code'),
    })
  }
}
