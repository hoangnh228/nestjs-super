import { Module } from '@nestjs/common'
import { LanguageController } from 'src/routes/language/language.controller'
import { LanguageService } from 'src/routes/language/language.service'
import { LanguageRepo } from 'src/routes/language/language.repo'

@Module({
  providers: [LanguageService, LanguageRepo],
  controllers: [LanguageController],
})
export class LanguageModule {}
