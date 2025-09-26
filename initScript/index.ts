import { UserStatus } from '@prisma/client'
import { env } from 'process'
import { ROLES } from 'src/shared/constants/role.constants'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'

const prisma = new PrismaService()
const hashingService = new HashingService()

const main = async () => {
  const roleCount = await prisma.role.count()
  if (roleCount > 0) {
    throw new Error('Roles already exist')
  }

  const roles = await prisma.role.createMany({
    data: [
      { name: ROLES.ADMIN, description: 'Admin role' },
      { name: ROLES.CLIENT, description: 'Client role' },
      { name: ROLES.SELLER, description: 'Seller role' },
    ],
  })

  const adminRole = await prisma.role.findFirstOrThrow({
    where: {
      name: ROLES.ADMIN,
    },
  })

  const adminUser = await prisma.user.create({
    data: {
      email: env.ADMIN_EMAIL ?? '',
      password: await hashingService.hash(env.ADMIN_PASSWORD ?? ''),
      roleId: adminRole.id,
      name: env.ADMIN_NAME ?? '',
      phoneNumber: env.ADMIN_PHONE_NUMBER ?? '',
      status: UserStatus.ACTIVE,
    },
  })

  return {
    createdRoleCount: roles.count,
    adminUser,
  }
}

main()
  .then(({ adminUser, createdRoleCount }) => {
    console.log(`Created ${createdRoleCount} roles`)
    console.log(`Created admin user: ${adminUser.email}`)
  })
  .catch(console.error)
