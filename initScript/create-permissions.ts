import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTP_METHODS, ROLES } from 'src/shared/constants/role.constants'
import { PrismaService } from 'src/shared/services/prisma.service'

const SellerModules = ['AUTH', 'MEDIA', 'MANAGE-PRODUCT', 'PRODUCT-TRANSLATION', 'PROFILE', 'CART', 'ORDERS']
const ClientModules = ['AUTH', 'MEDIA', 'PROFILE', 'CART', 'ORDERS']

const prisma = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(4000)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router

  const dbPermissions = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  const availableRoutes: { path: string; method: keyof typeof HTTP_METHODS; name: string; module: string }[] =
    router.stack
      .map((layer: any) => {
        if (layer.route) {
          const method = (layer.route?.stack[0]?.method as string).toUpperCase() as keyof typeof HTTP_METHODS
          const path = layer.route?.path
          const name = `${method} ${path.split('/').pop()}`
          const module = (path.split('/')[1] as string).toUpperCase()
          return {
            path,
            method,
            name,
            module,
          }
        }
      })
      .filter((route: any) => route !== undefined)

  // console.log(availableRoutes)

  // create object dbPermissions with key is [method-path]
  const dbPermissionsObject: Record<string, (typeof dbPermissions)[number]> = dbPermissions.reduce(
    (acc, permission) => {
      acc[`${permission.method}-${permission.path}`] = permission
      return acc
    },
    {},
  )

  // create object availableRoutes with key is [method-path]
  const availableRoutesObject: Record<string, (typeof availableRoutes)[number]> = availableRoutes.reduce(
    (acc, route) => {
      acc[`${route.method}-${route.path}`] = route
      return acc
    },
    {},
  )

  // find non exist permissions in availableRoutesObject but exist in dbPermissionsObject
  const deletePermissions = dbPermissions.filter(
    (permission) => !availableRoutesObject[`${permission.method}-${permission.path}`],
  )

  // delete deletePermissions
  if (deletePermissions.length > 0) {
    const deleted = await prisma.permission.deleteMany({
      where: {
        id: { in: deletePermissions.map((permission) => permission.id) },
      },
    })
    console.log('Deleted permissions: ', deleted.count)
  } else {
    console.log('No permissions to delete')
  }

  // find non exist permissions in dbPermissionsObject but exist in availableRoutesObject
  const createPermissions = availableRoutes.filter((route) => !dbPermissionsObject[`${route.method}-${route.path}`])

  // create createPermissions
  if (createPermissions.length > 0) {
    const created = await prisma.permission.createMany({
      data: createPermissions,
      skipDuplicates: true,
    })
    console.log('Created permissions: ', created.count)
  } else {
    console.log('No permissions to create')
  }

  // get all permissions from db
  const latestPermissions = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  // update permissions for Admin Role
  const adminRole = await prisma.role.findFirstOrThrow({
    where: {
      name: ROLES.ADMIN,
      deletedAt: null,
    },
  })

  await prisma.role.update({
    where: {
      id: adminRole.id,
    },
    data: {
      permissions: { set: latestPermissions.map((permission) => ({ id: permission.id })) },
    },
  })

  const adminPermissionIds = latestPermissions.map((permission) => ({ id: permission.id }))
  const sellerPermissionIds = latestPermissions
    .filter((permission) => SellerModules.includes(permission.module))
    .map((p) => ({ id: p.id }))
  const clientPermissionIds = latestPermissions
    .filter((permission) => ClientModules.includes(permission.module))
    .map((p) => ({ id: p.id }))

  await Promise.all([
    updateRole(adminPermissionIds, ROLES.ADMIN),
    updateRole(sellerPermissionIds, ROLES.SELLER),
    updateRole(clientPermissionIds, ROLES.CLIENT),
  ])

  process.exit(0)
}

const updateRole = async (permissionIds: { id: number }[], roleName: string) => {
  const role = await prisma.role.findFirstOrThrow({
    where: {
      name: roleName,
      deletedAt: null,
    },
  })

  await prisma.role.update({
    where: {
      id: role.id,
    },
    data: {
      permissions: { set: permissionIds },
    },
  })
}

void bootstrap()
