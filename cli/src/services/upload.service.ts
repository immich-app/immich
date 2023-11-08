import axios, { AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { ApiConfiguration } from '../cores/api-configuration';

export class UploadService {
  private readonly uploadConfig: AxiosRequestConfig<any>;
  private readonly checkAssetExistenceConfig: AxiosRequestConfig<any>;
  private readonly importConfig: AxiosRequestConfig<any>;

  constructor(apiConfiguration: ApiConfiguration) {
    this.uploadConfig = {
      method: 'post',
      maxRedirects: 0,
      url: `${apiConfiguration.instanceUrl}/asset/upload`,
      headers: {
        'x-api-key': apiConfiguration.apiKey,
      },
      maxContentLength: Number.POSITIVE_INFINITY,
      maxBodyLength: Number.POSITIVE_INFINITY,
    };

    this.importConfig = {
      method: 'post',
      maxRedirects: 0,
      url: `${apiConfiguration.instanceUrl}/asset/import`,
      headers: {
        'x-api-key': apiConfiguration.apiKey,
        'Content-Type': 'application/json',
      },
      maxContentLength: Number.POSITIVE_INFINITY,
      maxBodyLength: Number.POSITIVE_INFINITY,
    };

    this.checkAssetExistenceConfig = {
      method: 'post',
      maxRedirects: 0,
      url: `${apiConfiguration.instanceUrl}/asset/bulk-upload-check`,
      headers: {
        'x-api-key': apiConfiguration.apiKey,
        'Content-Type': 'application/json',
      },
    };
  }

  public checkIfAssetAlreadyExists(path: string, checksum: string) {
    this.checkAssetExistenceConfig.data = JSON.stringify({ assets: [{ id: path, checksum: checksum }] });

    // TODO: retry on 500 errors?
    return axios(this.checkAssetExistenceConfig);
  }

  public upload(data: FormData) {
    this.uploadConfig.data = data;

    // TODO: retry on 500 errors?
    return axios(this.uploadConfig);
  }

  public import(data: any) {
    this.importConfig.data = data;

    // TODO: retry on 500 errors?
    return axios(this.importConfig);
  }
}
