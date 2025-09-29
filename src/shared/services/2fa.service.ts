import { Injectable } from '@nestjs/common'
import * as OTPAuth from 'otpauth'
import env from 'src/shared/config'

@Injectable()
export class TwoFactorAuthenticationService {
  private createTOTP(email: string, secret?: string) {
    return new OTPAuth.TOTP({
      // Provider or service the account is associated with.
      issuer: env.APP_NAME,
      // Account identifier.
      label: email,
      // Algorithm used for the HMAC function, possible values are:
      //   "SHA1", "SHA224", "SHA256", "SHA384", "SHA512",
      //   "SHA3-224", "SHA3-256", "SHA3-384" and "SHA3-512".
      algorithm: 'SHA1',
      // Length of the generated tokens.
      digits: 6,
      // Interval of time for which a token is valid, in seconds.
      period: 30,
      // Arbitrary key encoded in base32 or `OTPAuth.Secret` instance
      // (if omitted, a cryptographically secure random secret is generated).
      secret: secret || new OTPAuth.Secret(),
      //   or: `OTPAuth.Secret.fromBase32("US3WHSG7X5KAPV27VANWKQHF3SH3HULL")`
      //   or: `new OTPAuth.Secret()`
    })
  }

  generateTOTP(email: string) {
    const totp = this.createTOTP(email)
    return {
      secret: totp.secret.base32,
      uri: totp.toString(),
    }
  }

  verifyTOTP({ email, token, secret }: { email: string; token: string; secret?: string }) {
    const totp = this.createTOTP(email, secret)
    const delta = totp.validate({ token, window: 1 })
    return delta !== null
  }
}
