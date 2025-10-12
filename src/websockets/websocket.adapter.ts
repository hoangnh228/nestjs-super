/* eslint-disable @typescript-eslint/no-floating-promises */
import { SharedWebsocketRepository } from './../shared/repositories/shared-websocket.repo'
import { INestApplicationContext } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { Server, ServerOptions, Socket } from 'socket.io'
import { generateRoomUserId } from 'src/shared/helpers'
import { TokenService } from 'src/shared/services/token.service'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import env from 'src/shared/config'

// const namespaces = ['/', 'payment', 'chat']

export class WebsocketAdapter extends IoAdapter {
  private readonly sharedWebsocketRepository: SharedWebsocketRepository
  private readonly tokenService: TokenService
  private adapterConstructor: ReturnType<typeof createAdapter>

  constructor(app: INestApplicationContext) {
    super(app)
    this.sharedWebsocketRepository = app.get(SharedWebsocketRepository)
    this.tokenService = app.get(TokenService)
  }

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({ url: env.REDIS_URL })
    const subClient = pubClient.duplicate()

    await Promise.all([pubClient.connect(), subClient.connect()])

    this.adapterConstructor = createAdapter(pubClient, subClient)
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server: Server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST'],
      },
    })

    // apply for main namespace (/)
    server.use((socket, next) => {
      this.authMiddleware(socket, next)
    })

    // dynamic middleware not apply for main namespace (/)
    server.of(/.*/).use((socket, next) => {
      this.authMiddleware(socket, next)
    })

    // namespaces.forEach((namespace) => {
    //   server.of(namespace).use(this.authMiddleware)
    // })

    return server
  }

  async authMiddleware(socket: Socket, next: (err?: any) => void) {
    const { authorization } = socket.handshake.headers
    if (!authorization) {
      return next(new Error('Unauthorized! Missing authorization header'))
    }

    const accessToken = authorization.split(' ')[1]
    if (!accessToken) {
      return next(new Error('Unauthorized! Access token not found'))
    }

    try {
      const { userId } = await this.tokenService.verifyAccessToken(accessToken)
      await socket.join(generateRoomUserId(userId))

      // await this.sharedWebsocketRepository.create({ id: socket.id, userId })
      // socket.on('disconnect', async (reason) => {
      //   await this.sharedWebsocketRepository.delete(socket.id)
      //   console.log(`Client disconnected: ${socket.id}, reason: ${reason}`)
      // })

      next()
    } catch (error) {
      next(error)
    }
  }
}
