import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import env from './shared/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(env.APP_PORT ?? 4000)
}
void bootstrap()
