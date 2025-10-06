import { Injectable } from '@nestjs/common'
import env from 'src/shared/config'
import { Upload } from '@aws-sdk/lib-storage'
import { PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import mime from 'mime-types'

@Injectable()
export class S3Service {
  private s3: S3

  constructor() {
    this.s3 = new S3({
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    })
  }

  uploadFile({ filename, filepath, contentType }: { filename: string; filepath: string; contentType: string }) {
    const parallelUploads3 = new Upload({
      client: this.s3,
      params: { Bucket: env.S3_BUCKET, Key: filename, Body: readFileSync(filepath), ContentType: contentType },
      tags: [],
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false,
    })

    // parallelUploads3.on('httpUploadProgress', (progress) => {
    //   console.log(progress)
    // })

    return parallelUploads3.done()
  }

  createPresignedUrlWithClient = (filename: string) => {
    const contentType = mime.lookup(filename) || 'application/octet-stream'
    const command = new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: filename, ContentType: contentType })
    return getSignedUrl(this.s3, command, { expiresIn: 10 }) // 10 seconds
  }
}

// const s3Instance = new S3Service()
// s3Instance
//   .uploadFile({
//     filename: 'images/test.f0dc5e57-d3fb-4041-b01c-f7f124fe2207.jpg',
//     filepath: '/Users/cam/code/nestjs-super/upload/f0dc5e57-d3fb-4041-b01c-f7f124fe2207.jpg',
//     contentType: 'image/jpeg',
//   })
//   .then(console.log)
//   .catch(console.error)
