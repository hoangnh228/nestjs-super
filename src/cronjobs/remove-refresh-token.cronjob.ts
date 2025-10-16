import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class RemoveRefreshTokenCronjob {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(RemoveRefreshTokenCronjob.name)

  // @Cron('0 0 7 * * 1')
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  handleCron() {
    this.logger.debug('Called when the current second is 0, the current minute is 0, the current hour is 1')
    this.prismaService.refreshToken
      .deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })
      .then(({ count }) => {
        this.logger.debug(`Deleted ${count} expired refresh tokens`)
      })
      .catch((error) => {
        this.logger.error('Error deleting expired refresh tokens', error)
      })
  }
}
