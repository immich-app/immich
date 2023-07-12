import { UploadService } from './upload.service';
import mockfs from 'mock-fs';
import axios from 'axios';
import mockAxios from 'jest-mock-axios';
import FormData from 'form-data';
import { ApiConfiguration } from '../cores/api-configuration';

describe('UploadService', () => {
  let uploadService: UploadService;

  beforeAll(() => {
    // Write a dummy output before mock-fs to prevent some annoying errors
    console.log();
  });

  beforeEach(() => {
    const apiConfiguration = new ApiConfiguration('https://example.com/api', 'key');

    uploadService = new UploadService(apiConfiguration);
  });

  it('should upload a single file', async () => {
    const data = new FormData();

    uploadService.upload(data);

    mockAxios.mockResponse();
    expect(axios).toHaveBeenCalled();
  });

  afterEach(() => {
    mockfs.restore();
    mockAxios.reset();
  });
});
