import { Request } from 'express';
import * as fs from 'fs';
import { multerUtils } from './asset-upload.config';

const { fileFilter, destination, filename } = multerUtils;

const mock = {
  req: {} as Request,
  userRequest: {
    user: {
      id: 'test-user',
    },
    body: {
      deviceId: 'test-device',
      fileExtension: '.jpg',
    },
  } as Request,
  file: { originalname: 'test.jpg' } as Express.Multer.File,
};

jest.mock('fs');

describe('assetUploadOption', () => {
  let callback: jest.Mock;
  let existsSync: jest.Mock;
  let mkdirSync: jest.Mock;

  beforeEach(() => {
    jest.mock('fs');
    mkdirSync = fs.mkdirSync as jest.Mock;
    existsSync = fs.existsSync as jest.Mock;
    callback = jest.fn();

    existsSync.mockImplementation(() => true);
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('fileFilter', () => {
    it('should require a user', () => {
      fileFilter(mock.req, mock.file, callback);

      expect(callback).toHaveBeenCalled();
      const [error, name] = callback.mock.calls[0];
      expect(error).toBeDefined();
      expect(name).toBeUndefined();
    });

    it('should allow images', async () => {
      const file = { mimetype: 'image/jpeg', originalname: 'test.jpg' } as any;
      fileFilter(mock.userRequest, file, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow videos', async () => {
      const file = { mimetype: 'video/mp4', originalname: 'test.mp4' } as any;
      fileFilter(mock.userRequest, file, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow webm videos', async () => {
      const file = { mimetype: 'video/webm', originalname: 'test.webm' } as any;
      fileFilter(mock.userRequest, file, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow .raf recognized', () => {
      const file = { mimetype: 'image/x-fuji-raf', originalname: 'test.raf' } as any;
      fileFilter(mock.userRequest, file, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow .srw recognized', () => {
      const file = { mimetype: 'image/x-samsung-srw', originalname: 'test.srw' } as any;
      fileFilter(mock.userRequest, file, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow .wmv videos', () => {
      const file = { mimetype: 'video/x-ms-wmv', originalname: 'test.wmv' } as any;
      fileFilter(mock.userRequest, file, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow .mkv videos', () => {
      const file = { mimetype: 'video/x-matroska', originalname: 'test.mkv' } as any;
      fileFilter(mock.userRequest, file, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow .mpg videos', () => {
      const file = { mimetype: 'video/mpeg', originalname: 'test.mpg' } as any;
      fileFilter(mock.userRequest, file, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should allow .flv videos', () => {
      const file = { mimetype: 'video/x-flv', originalname: 'test.flv' } as any;
      fileFilter(mock.userRequest, file, callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should not allow unknown types', async () => {
      const file = { mimetype: 'application/html', originalname: 'test.html' } as any;
      const callback = jest.fn();
      fileFilter(mock.userRequest, file, callback);

      expect(callback).toHaveBeenCalled();
      const [error, accepted] = callback.mock.calls[0];
      expect(error).toBeDefined();
      expect(accepted).toBe(false);
    });
  });

  describe('destination', () => {
    it('should require a user', () => {
      destination(mock.req, mock.file, callback);

      expect(callback).toHaveBeenCalled();
      const [error, name] = callback.mock.calls[0];
      expect(error).toBeDefined();
      expect(name).toBeUndefined();
    });

    it('should create non-existing directories', () => {
      existsSync.mockImplementation(() => false);

      destination(mock.userRequest, mock.file, callback);

      expect(existsSync).toHaveBeenCalled();
      expect(mkdirSync).toHaveBeenCalled();
    });

    it('should return the destination', () => {
      destination(mock.userRequest, mock.file, callback);

      expect(mkdirSync).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(null, 'upload/upload/test-user');
    });
  });

  describe('filename', () => {
    it('should require a user', () => {
      filename(mock.req, mock.file, callback);

      expect(callback).toHaveBeenCalled();
      const [error, name] = callback.mock.calls[0];
      expect(error).toBeDefined();
      expect(name).toBeUndefined();
    });

    it('should return the filename', () => {
      filename(mock.userRequest, mock.file, callback);

      expect(callback).toHaveBeenCalled();
      const [error, name] = callback.mock.calls[0];
      expect(error).toBeNull();
      expect(name.endsWith('.jpg')).toBeTruthy();
    });

    it('should sanitize the filename', () => {
      const body = { ...mock.userRequest.body, fileExtension: '.jp\u0000g' };
      const request = { ...mock.userRequest, body } as Request;
      filename(request, mock.file, callback);

      expect(callback).toHaveBeenCalled();
      const [error, name] = callback.mock.calls[0];
      expect(error).toBeNull();
      expect(name.endsWith(mock.userRequest.body.fileExtension)).toBeTruthy();
    });

    it('should not change the casing of the extension', () => {
      // Case is deliberately mixed to cover both .upper() and .lower()
      const body = { ...mock.userRequest.body, fileExtension: '.JpEg' };
      const request = { ...mock.userRequest, body } as Request;

      filename(request, mock.file, callback);

      expect(callback).toHaveBeenCalled();
      const [error, name] = callback.mock.calls[0];
      expect(error).toBeNull();
      expect(name.endsWith(body.fileExtension)).toBeTruthy();
    });
  });
});
