import { UPLOAD_DIR } from './../../shared/constants/other.constant'
import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ZodSerializerDto } from 'nestjs-zod'
import path from 'path'
import { PresignedUploadFileBodyDto, PresignedUploadFileResDto, UploadFilesResDto } from 'src/routes/media/media.dto'
import { MediaService } from 'src/routes/media/media.service'
import { ParseFilePipeWithUnlink } from 'src/routes/media/parse-file-pipe-with-unlink.pipe'
// import env from 'src/shared/config'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

// Custom validator for multiple image types
class ImageTypeValidator extends FileValidator {
  private allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  buildErrorMessage(): string {
    return `Validation failed (allowed types: ${this.allowedMimeTypes.join(', ')})`
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false
    return this.allowedMimeTypes.includes(file.mimetype)
  }
}

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}
  @Post('images/upload')
  @ZodSerializerDto(UploadFilesResDto)
  @UseInterceptors(
    FilesInterceptor('file', 5, {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadFile(
    @UploadedFiles(
      new ParseFilePipeWithUnlink({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
          new ImageTypeValidator({}),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    // console.log(files)
    // return files.map((file) => ({ url: `${env.PREFIX_STATIC_MEDIA}/${file.filename}` }))
    return this.mediaService.uploadFiles(files)
  }

  @Get('static/:filename')
  @IsPublic()
  serveFile(@Param('filename') filename: string, @Res() res) {
    return res.sendFile(path.resolve(UPLOAD_DIR, filename), (error) => {
      const notFound = new NotFoundException('File not found')
      if (error) {
        res.status(notFound.getStatus()).json(notFound.getResponse())
      }
    })
  }

  @Post('images/upload/presigned-url')
  @ZodSerializerDto(PresignedUploadFileResDto)
  @IsPublic()
  async getPresignedUrl(@Body() body: PresignedUploadFileBodyDto) {
    return this.mediaService.getPresignedUrl(body)
  }
}
