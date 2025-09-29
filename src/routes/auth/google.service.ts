import { HashingService } from 'src/shared/services/hashing.service'
import { Injectable } from '@nestjs/common'
import env from 'src/shared/config'
import { google } from 'googleapis'
import { GoogleAuthStateType } from 'src/routes/auth/auth.model'
import { AuthRepository } from 'src/routes/auth/auth.repo'
import { RolesService } from 'src/routes/auth/roles.service'
import { v4 as uuidv4 } from 'uuid'
import { AuthService } from 'src/routes/auth/auth.service'

@Injectable()
export class GoogleService {
  private oauth2Client
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly rolesService: RolesService,
    private readonly hashingService: HashingService,
    private readonly authService: AuthService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI)
  }

  getOAuthUrl({ userAgent, ip }: GoogleAuthStateType) {
    const scope = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']

    // convert object to base64 string for safely pass to url
    const stateString = Buffer.from(JSON.stringify({ userAgent, ip })).toString('base64')
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
      state: stateString,
      include_granted_scopes: true,
    })

    return { url }
  }

  async googleCallback({ code, state }: { code: string; state: string }) {
    try {
      let userAgent = ''
      let ip = ''

      // 1. get state from url
      try {
        if (state) {
          const clientInfo = JSON.parse(Buffer.from(state, 'base64').toString('utf-8')) as GoogleAuthStateType
          userAgent = clientInfo.userAgent
          ip = clientInfo.ip
        }
      } catch (error) {
        console.log(error)
      }

      // 2. get token from google
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      // 3. get user info from google
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
      const { data } = await oauth2.userinfo.get()

      if (!data.email) {
        throw new Error('Can not get user info from google')
      }

      // 4. check user is exist
      let user = await this.authRepository.findUserWithRole({ email: data.email })
      if (!user) {
        // if not exist, create user
        const clientRoleId = await this.rolesService.getClientRoleId()
        const randomString = uuidv4()
        const password = await this.hashingService.hash(randomString)
        user = await this.authRepository.createUserIncludeRole({
          email: data.email,
          name: data.name ?? '',
          password,
          roleId: clientRoleId,
          phoneNumber: '',
          avatar: data.picture ?? '',
        })
      }

      // 5. create device
      const device = await this.authRepository.createDevice({
        userId: user.id,
        userAgent,
        ip,
      })

      // 6. generate tokens
      const generateTokens = await this.authService.generateTokens({
        userId: user.id,
        roleId: user.roleId,
        roleName: user.role.name,
        deviceId: device.id,
      })

      return generateTokens
    } catch (error) {
      console.log(error)
      throw Error('Failed to login with google')
    }
  }
}
