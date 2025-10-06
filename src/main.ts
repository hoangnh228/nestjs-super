import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import env from './shared/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import { UPLOAD_DIR } from 'src/shared/constants/other.constant'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors()
  // app.useStaticAssets(UPLOAD_DIR, { prefix: '/media/static' })
  await app.listen(env.APP_PORT ?? 4000)
}
void bootstrap()
