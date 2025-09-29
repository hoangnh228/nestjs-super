import { UnprocessableEntityException } from '@nestjs/common'

export const InvalidOtpException = new UnprocessableEntityException([
  {
    message: 'Verification code is invalid',
    path: 'code',
  },
])

export const ExpiredOtpException = new UnprocessableEntityException([
  {
    message: 'Verification code is expired',
    path: 'code',
  },
])

export const EmailAlreadyExistsException = new UnprocessableEntityException([
  {
    message: 'Email already exists',
    path: 'email',
  },
])

export const EmailNotFoundException = new UnprocessableEntityException([
  {
    message: 'Email not found',
    path: 'email',
  },
])

export const FailedToSendOtpEmailException = new UnprocessableEntityException([
  {
    message: 'Failed to send OTP email',
    path: 'code',
  },
])

export const UserNotFoundException = new UnprocessableEntityException([
  {
    message: 'User not found',
    path: 'email',
  },
])

export const InvalidPasswordException = new UnprocessableEntityException([
  {
    message: 'Invalid password',
    path: 'password',
  },
])

export const TwoFactorOrEmailOtpRequiredException = new UnprocessableEntityException([
  {
    message: '2FA or email OTP is required',
    path: 'code',
  },
])

export const TwoFactorInvalidException = new UnprocessableEntityException([
  {
    message: '2FA is invalid',
    path: 'code',
  },
])

export const TwoFactorNotSetupException = new UnprocessableEntityException([
  {
    message: '2FA is not setup',
    path: 'userId',
  },
])
