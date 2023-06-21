import { Request } from 'express';
import * as fs from 'fs';
import { AuthRequest } from '../decorators/auth-user.decorator';
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
  } as AuthRequest,
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

    for (const { mimetype, extension } of [
      { mimetype: 'image/avif', extension: 'avif' },
      { mimetype: 'image/dng', extension: 'dng' },
      { mimetype: 'image/gif', extension: 'gif' },
      { mimetype: 'image/heic', extension: 'heic' },
      { mimetype: 'image/heif', extension: 'heif' },
      { mimetype: 'image/jpeg', extension: 'jpeg' },
      { mimetype: 'image/jpeg', extension: 'jpg' },
      { mimetype: 'image/jxl', extension: 'jxl' },
      { mimetype: 'image/png', extension: 'png' },
      { mimetype: 'image/tiff', extension: 'tiff' },
      { mimetype: 'image/webp', extension: 'webp' },
      { mimetype: 'image/x-adobe-dng', extension: 'dng' },
      { mimetype: 'image/x-arriflex-ari', extension: 'ari' },
      { mimetype: 'image/x-canon-cr2', extension: 'cr2' },
      { mimetype: 'image/x-canon-cr3', extension: 'cr3' },
      { mimetype: 'image/x-canon-crw', extension: 'crw' },
      { mimetype: 'image/x-epson-erf', extension: 'erf' },
      { mimetype: 'image/x-fuji-raf', extension: 'raf' },
      { mimetype: 'image/x-hasselblad-3fr', extension: '3fr' },
      { mimetype: 'image/x-hasselblad-fff', extension: 'fff' },
      { mimetype: 'image/x-kodak-dcr', extension: 'dcr' },
      { mimetype: 'image/x-kodak-k25', extension: 'k25' },
      { mimetype: 'image/x-kodak-kdc', extension: 'kdc' },
      { mimetype: 'image/x-leica-rwl', extension: 'rwl' },
      { mimetype: 'image/x-minolta-mrw', extension: 'mrw' },
      { mimetype: 'image/x-nikon-nef', extension: 'nef' },
      { mimetype: 'image/x-olympus-orf', extension: 'orf' },
      { mimetype: 'image/x-olympus-ori', extension: 'ori' },
      { mimetype: 'image/x-panasonic-raw', extension: 'raw' },
      { mimetype: 'image/x-pentax-pef', extension: 'pef' },
      { mimetype: 'image/x-phantom-cin', extension: 'cin' },
      { mimetype: 'image/x-phaseone-cap', extension: 'cap' },
      { mimetype: 'image/x-phaseone-iiq', extension: 'iiq' },
      { mimetype: 'image/x-samsung-srw', extension: 'srw' },
      { mimetype: 'image/x-sigma-x3f', extension: 'x3f' },
      { mimetype: 'image/x-sony-arw', extension: 'arw' },
      { mimetype: 'image/x-sony-sr2', extension: 'sr2' },
      { mimetype: 'image/x-sony-srf', extension: 'srf' },
      { mimetype: 'video/3gpp', extension: '3gp' },
      { mimetype: 'video/avi', extension: 'avi' },
      { mimetype: 'video/mov', extension: 'mov' },
      { mimetype: 'video/mp4', extension: 'mp4' },
      { mimetype: 'video/mpeg', extension: 'mpg' },
      { mimetype: 'video/quicktime', extension: 'mov' },
      { mimetype: 'video/webm', extension: 'webm' },
      { mimetype: 'video/x-flv', extension: 'flv' },
      { mimetype: 'video/x-matroska', extension: 'mkv' },
      { mimetype: 'video/x-ms-wmv', extension: 'wmv' },
      { mimetype: 'video/x-msvideo', extension: 'avi' },
    ]) {
      const name = `test.${extension}`;
      it(`should allow ${name} (${mimetype})`, async () => {
        fileFilter(mock.userRequest, { mimetype, originalname: name }, callback);
        expect(callback).toHaveBeenCalledWith(null, true);
      });
    }

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
