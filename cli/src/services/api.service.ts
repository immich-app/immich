import {
  addAssetsToAlbum,
  checkBulkUpload,
  createAlbum,
  createApiKey,
  getAllAlbums,
  getAllAssets,
  getAssetStatistics,
  getMyUserInfo,
  getServerVersion,
  getSupportedMediaTypes,
  login,
  pingServer,
  signUpAdmin,
  uploadFile,
  ApiKeyCreateDto,
  AssetBulkUploadCheckDto,
  BulkIdsDto,
  CreateAlbumDto,
  CreateAssetDto,
  LoginCredentialDto,
  SignUpDto,
} from '@immich/sdk';

/**
 * Wraps the underlying API to abstract away the options and make API calls mockable for testing.
 */
export class ImmichApi {
  private readonly options;

  constructor(
    public instanceUrl: string,
    public apiKey: string,
  ) {
    this.options = {
      baseUrl: instanceUrl,
      headers: {
        'x-api-key': apiKey,
      },
    };
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    if (!this.options.headers) {
      throw new Error('missing headers');
    }
    this.options.headers['x-api-key'] = apiKey;
  }

  addAssetsToAlbum(id: string, bulkIdsDto: BulkIdsDto) {
    return addAssetsToAlbum({ id, bulkIdsDto }, this.options);
  }

  checkBulkUpload(assetBulkUploadCheckDto: AssetBulkUploadCheckDto) {
    return checkBulkUpload({ assetBulkUploadCheckDto }, this.options);
  }

  createAlbum(createAlbumDto: CreateAlbumDto) {
    return createAlbum({ createAlbumDto }, this.options);
  }

  createApiKey(apiKeyCreateDto: ApiKeyCreateDto, options: { headers: { Authorization: string } }) {
    return createApiKey({ apiKeyCreateDto }, { ...this.options, ...options });
  }

  getAllAlbums() {
    return getAllAlbums({}, this.options);
  }

  getAllAssets() {
    return getAllAssets({}, this.options);
  }

  getAssetStatistics() {
    return getAssetStatistics({}, this.options);
  }

  getMyUserInfo() {
    return getMyUserInfo(this.options);
  }

  getServerVersion() {
    return getServerVersion(this.options);
  }

  getSupportedMediaTypes() {
    return getSupportedMediaTypes(this.options);
  }

  login(loginCredentialDto: LoginCredentialDto) {
    return login({ loginCredentialDto }, this.options);
  }

  pingServer() {
    return pingServer(this.options);
  }

  signUpAdmin(signUpDto: SignUpDto) {
    return signUpAdmin({ signUpDto }, this.options);
  }

  uploadFile(createAssetDto: CreateAssetDto) {
    return uploadFile({ createAssetDto }, this.options);
  }
}
