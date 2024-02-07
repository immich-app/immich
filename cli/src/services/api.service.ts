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

  async addAssetsToAlbum(id: string, bulkIdsDto: BulkIdsDto) {
    return await addAssetsToAlbum({ id, bulkIdsDto }, this.options);
  }

  async checkBulkUpload(assetBulkUploadCheckDto: AssetBulkUploadCheckDto) {
    return await checkBulkUpload({ assetBulkUploadCheckDto }, this.options);
  }

  async createAlbum(createAlbumDto: CreateAlbumDto) {
    return await createAlbum({ createAlbumDto }, this.options);
  }

  async createApiKey(apiKeyCreateDto: ApiKeyCreateDto, options: { headers: { Authorization: string } }) {
    return await createApiKey({ apiKeyCreateDto }, { ...this.options, ...options });
  }

  async getAllAlbums() {
    return await getAllAlbums({}, this.options);
  }

  async getAllAssets() {
    return await getAllAssets({}, this.options);
  }

  async getAssetStatistics() {
    return await getAssetStatistics({}, this.options);
  }

  async getMyUserInfo() {
    return await getMyUserInfo(this.options);
  }

  async getServerVersion() {
    return await getServerVersion(this.options);
  }

  async getSupportedMediaTypes() {
    return await getSupportedMediaTypes(this.options);
  }

  async login(loginCredentialDto: LoginCredentialDto) {
    return await login({ loginCredentialDto }, this.options);
  }

  async pingServer() {
    return await pingServer(this.options);
  }

  async signUpAdmin(signUpDto: SignUpDto) {
    return await signUpAdmin({ signUpDto }, this.options);
  }

  async uploadFile(createAssetDto: CreateAssetDto) {
    return await uploadFile({ createAssetDto }, this.options);
  }
}
