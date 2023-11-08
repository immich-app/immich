import { UploadService } from './upload.service';
import axios from 'axios';
import FormData from 'form-data';
import { ApiConfiguration } from '../cores/api-configuration';

jest.mock('axios', () => jest.fn());

describe('UploadService', () => {
  let uploadService: UploadService;

  beforeEach(() => {
    const apiConfiguration = new ApiConfiguration('https://example.com/api', 'key');

    uploadService = new UploadService(apiConfiguration);
  });

  it('should call axios', async () => {
    const data = new FormData();

    await uploadService.upload(data);

    expect(axios).toHaveBeenCalled();
  });
});
