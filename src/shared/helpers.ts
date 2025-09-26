import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { randomInt } from 'crypto'

// type predicate
export const isUniqueConstraintPrismaError = (error: any): error is PrismaClientKnownRequestError => {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2002'
}

export const isNotFoundPrismaError = (error: any): error is PrismaClientKnownRequestError => {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2025'
}

export const generateOtp = () => {
  return String(randomInt(100000, 999999))
}
