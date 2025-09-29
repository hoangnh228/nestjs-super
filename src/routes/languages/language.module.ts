import { Module } from '@nestjs/common'
import { LanguageController } from 'src/routes/languages/language.controller'
import { LanguageService } from 'src/routes/languages/language.service'
import { LanguageRepo } from 'src/routes/languages/language.repo'

@Module({
  providers: [LanguageService, LanguageRepo],
  controllers: [LanguageController],
})
export class LanguageModule {}
