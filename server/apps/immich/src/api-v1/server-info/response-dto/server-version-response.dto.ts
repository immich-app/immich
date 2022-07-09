import { IServerVersion } from 'apps/immich/src/constants/server_version.constant';

export class ServerVersionReponseDto implements IServerVersion {
  major!: number;
  minor!: number;
  patch!: number;
  build!: number;
}
