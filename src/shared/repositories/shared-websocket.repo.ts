import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class SharedWebsocketRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findMany(userId: number) {
    return this.prismaService.websocket.findMany({ where: { userId } })
  }

  create(data: { id: string; userId: number }) {
    return this.prismaService.websocket.create({ data })
  }

  delete(id: string) {
    return this.prismaService.websocket.deleteMany({ where: { id } })
  }
}
