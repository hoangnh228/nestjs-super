import { Injectable } from '@nestjs/common'
import { unlink } from 'fs/promises'
import { PresignedUploadFileBodyType } from 'src/routes/media/media.model'
import { generateRandomFileName } from 'src/shared/helpers'
import { S3Service } from 'src/shared/services/s3.service'

@Injectable()
export class MediaService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFiles(files: Array<Express.Multer.File>) {
    const result = await Promise.all(
      files.map((file) => {
        return this.s3Service
          .uploadFile({
            filename: `images/${file.filename}`,
            filepath: file.path,
            contentType: file.mimetype,
          })
          .then((res) => ({ url: res.Location }))
      }),
    )

    // delete files after upload to s3
    await Promise.all(files.map((file) => unlink(file.path)))
    return { data: result }
  }

  async getPresignedUrl(body: PresignedUploadFileBodyType) {
    const randomFileName = generateRandomFileName(body.filename)
    const presignedUrl = await this.s3Service.createPresignedUrlWithClient(randomFileName)
    const url = presignedUrl.split('?')[0]
    return {
      url,
      presignedUrl,
    }
  }
}
