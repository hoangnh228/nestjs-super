import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { randomInt } from 'crypto'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// type predicate
export const isUniqueConstraintPrismaError = (error: any): error is PrismaClientKnownRequestError => {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2002'
}

export const isNotFoundPrismaError = (error: any): error is PrismaClientKnownRequestError => {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2025'
}

export const isForeignKeyConstraintPrismaError = (error: any): error is PrismaClientKnownRequestError => {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2003'
}

export const generateOtp = () => {
  return String(randomInt(100000, 999999))
}

export const generateRandomFileName = (fileName: string) => {
  const ext = path.extname(fileName)
  return `${uuidv4()}${ext}`
}
