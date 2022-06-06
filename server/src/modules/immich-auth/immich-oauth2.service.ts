import {BadRequestException, Injectable, Logger, UnauthorizedException} from '@nestjs/common';
import {HttpService} from "@nestjs/axios";
import {OAuthLoginDto} from "../../api-v1/auth/dto/o-auth-login.dto";
import {lastValueFrom} from "rxjs";
import {AxiosResponse} from "axios";
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../../api-v1/user/entities/user.entity";
import {Repository} from "typeorm";
import { ImmichAuthService } from './immich-auth.service';

@Injectable()
export class ImmichOauth2Service {

  private oauthUserinfoEndpoint: string;
  private oauthTokenEndpoint: string;

  constructor(
      @InjectRepository(UserEntity)
      private userRepository: Repository<UserEntity>,
      private httpService: HttpService,
      private immichAuthService: ImmichAuthService,
  ) {}

  public async validateUserOauth(params: OAuthLoginDto) {
    const userinfoEndpoint = await this.getUserinfoEndpoint();

    const headersRequest = {
      'Authorization': `Bearer ${params.accessToken}`,
    };

    const response = await lastValueFrom(await this.httpService
        .get(userinfoEndpoint, { headers: headersRequest }))
        .catch((e) => Logger.log(e, "AUTH")) as AxiosResponse;

    if (!response || response.status !== 200) {
      throw new UnauthorizedException('Cannot validate token');
    }

    const email = response.data['email'];
    if (!email || email === "") throw new BadRequestException("User email not found", "AUTH");

    const user = await this.userRepository.findOne({ email: email });

    if (!user) {
      Logger.log("User does not exist, signing up", "AUTH");
      return await this.immichAuthService.createUser(email, false, null);
    }

    return await this.userRepository.findOne({ email: email });
  }

  async getAccessTokenFromAuthCode(code: string, redirectUri: string): Promise<[string, string]> {
    const headersRequest = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const reqParams = new URLSearchParams();
    reqParams.append('grant_type', 'authorization_code');
    reqParams.append('code', code);
    reqParams.append('client_id', process.env.OAUTH2_CLIENT_ID);
    reqParams.append('client_secret', process.env.OAUTH2_CLIENT_SECRET);
    reqParams.append('redirect_uri', redirectUri);

    const tokenEndpoint = await this.getTokenEndpoint();
    const response = await lastValueFrom(await this.httpService
      .post(tokenEndpoint, reqParams, { headers: headersRequest }))
      .catch((e) => e) as AxiosResponse;

    if (!response || response.status !== 200) {
      Logger.debug(`Response from token endpoint with status code ${response.status}, cannot validate token`)
      throw new UnauthorizedException('Cannot validate token');
    }

    return [response.data['access_token'], response.data['refresh_token']];
  }

  private async getUserinfoEndpoint(): Promise<string> {
    if (this.oauthUserinfoEndpoint) return this.oauthUserinfoEndpoint;

    const endpoint = await this.fetchOauthEndpoint('userinfo_endpoint');
    if (endpoint) {
      this.oauthUserinfoEndpoint = endpoint;
      return this.oauthUserinfoEndpoint;
    }

    return undefined;
  }

  private async getTokenEndpoint(): Promise<string> {
    if (this.oauthTokenEndpoint) return this.oauthTokenEndpoint;

    const endpoint = await this.fetchOauthEndpoint('token_endpoint');
    if (endpoint) {
      this.oauthTokenEndpoint = endpoint;
      return this.oauthTokenEndpoint;
    }

    return undefined;
  }

  private async fetchOauthEndpoint(endpointId: string): Promise<string> {
    const response = await lastValueFrom(await this.httpService
        .get(process.env.OAUTH2_DISCOVERY_URL))
        .catch((e) => Logger.log(e, "AUTH")) as AxiosResponse;

    if (!response) return undefined;
    if (response.status !== 200) return undefined;

    Logger.debug(`Called discovery to get ${endpointId}`, "AUTH");
    const endpoint = response.data[endpointId];
    if (!endpoint) {
      Logger.debug(`${endpointId} not found`, "AUTH");
      return undefined;
    }

    return endpoint;
  }

}
