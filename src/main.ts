import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import env from './shared/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import { WebsocketAdapter } from 'src/websockets/websocket.adapter'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
// import { UPLOAD_DIR } from 'src/shared/constants/other.constant'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('Title example')
    .setDescription('The API description')
    .setVersion('1.0')
    .addTag('cats')
    .addBearerAuth()
    .addApiKey(
      {
        name: 'authorization',
        type: 'apiKey',
        in: 'headers',
        description:
          'Type into the input box: Bearer {your JWT token}. Example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
      'payment-api-key',
    )
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: { persistAuthorization: true },
  })

  const websocketAdapter = new WebsocketAdapter(app)
  await websocketAdapter.connectToRedis()

  // app.useStaticAssets(UPLOAD_DIR, { prefix: '/media/static' })
  await app.listen(env.APP_PORT ?? 4000)
}
void bootstrap()
