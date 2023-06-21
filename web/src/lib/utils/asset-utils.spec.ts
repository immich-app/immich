import type { AssetResponseDto } from '@api';
import { describe, expect, it } from '@jest/globals';
import { getAssetFilename, getFilenameExtension, getFileMimeType } from './asset-utils';

describe('get file extension from filename', () => {
	it('returns the extension without including the dot', () => {
		expect(getFilenameExtension('filename.txt')).toEqual('txt');
	});

	it('takes the last file extension and ignores the rest', () => {
		expect(getFilenameExtension('filename.txt.pdf')).toEqual('pdf');
		expect(getFilenameExtension('filename.txt.pdf.jpg')).toEqual('jpg');
	});

	it('returns an empty string when no file extension is found', () => {
		expect(getFilenameExtension('filename')).toEqual('');
		expect(getFilenameExtension('filename.')).toEqual('');
		expect(getFilenameExtension('filename..')).toEqual('');
		expect(getFilenameExtension('.filename')).toEqual('');
	});

	it('returns the extension from a filepath', () => {
		expect(getFilenameExtension('/folder/file.txt')).toEqual('txt');
		expect(getFilenameExtension('./folder/file.txt')).toEqual('txt');
		expect(getFilenameExtension('~/folder/file.txt')).toEqual('txt');
		expect(getFilenameExtension('./folder/.file.txt')).toEqual('txt');
		expect(getFilenameExtension('/folder.with.dots/file.txt')).toEqual('txt');
	});
});

describe('get asset filename', () => {
	it('returns the filename including file extension', () => {
		[
			{
				asset: {
					originalFileName: 'filename',
					originalPath: 'upload/library/test/2016/2016-08-30/filename.jpg'
				},
				result: 'filename.jpg'
			},
			{
				asset: {
					originalFileName: 'new-filename',
					originalPath:
						'upload/library/89d14e47-a40d-4cae-a347-a914cdef1f22/2016/2016-08-30/filename.jpg'
				},
				result: 'new-filename.jpg'
			},
			{
				asset: {
					originalFileName: 'new-filename.txt',
					originalPath: 'upload/library/test/2016/2016-08-30/filename.txt.jpg'
				},
				result: 'new-filename.txt.jpg'
			}
		].forEach(({ asset, result }) => {
			expect(getAssetFilename(asset as AssetResponseDto)).toEqual(result);
		});
	});
});

describe('get file mime type', () => {
	for (const { extension, mimeType } of [
		{ extension: '3fr', mimeType: 'image/x-hasselblad-3fr' },
		{ extension: '3gp', mimeType: 'video/3gpp' },
		{ extension: 'ari', mimeType: 'image/x-arriflex-ari' },
		{ extension: 'arw', mimeType: 'image/x-sony-arw' },
		{ extension: 'avif', mimeType: 'image/avif' },
		{ extension: 'cap', mimeType: 'image/x-phaseone-cap' },
		{ extension: 'cin', mimeType: 'image/x-phantom-cin' },
		{ extension: 'cr2', mimeType: 'image/x-canon-cr2' },
		{ extension: 'cr3', mimeType: 'image/x-canon-cr3' },
		{ extension: 'crw', mimeType: 'image/x-canon-crw' },
		{ extension: 'dcr', mimeType: 'image/x-kodak-dcr' },
		{ extension: 'dng', mimeType: 'image/dng' },
		{ extension: 'erf', mimeType: 'image/x-epson-erf' },
		{ extension: 'fff', mimeType: 'image/x-hasselblad-fff' },
		{ extension: 'heic', mimeType: 'image/heic' },
		{ extension: 'heif', mimeType: 'image/heif' },
		{ extension: 'iiq', mimeType: 'image/x-phaseone-iiq' },
		{ extension: 'insp', mimeType: 'image/jpeg' },
		{ extension: 'insv', mimeType: 'video/mp4' },
		{ extension: 'jxl', mimeType: 'image/jxl' },
		{ extension: 'k25', mimeType: 'image/x-kodak-k25' },
		{ extension: 'kdc', mimeType: 'image/x-kodak-kdc' },
		{ extension: 'mrw', mimeType: 'image/x-minolta-mrw' },
		{ extension: 'nef', mimeType: 'image/x-nikon-nef' },
		{ extension: 'orf', mimeType: 'image/x-olympus-orf' },
		{ extension: 'ori', mimeType: 'image/x-olympus-ori' },
		{ extension: 'pef', mimeType: 'image/x-pentax-pef' },
		{ extension: 'raf', mimeType: 'image/x-fuji-raf' },
		{ extension: 'raw', mimeType: 'image/x-panasonic-raw' },
		{ extension: 'rwl', mimeType: 'image/x-leica-rwl' },
		{ extension: 'sr2', mimeType: 'image/x-sony-sr2' },
		{ extension: 'srf', mimeType: 'image/x-sony-srf' },
		{ extension: 'srw', mimeType: 'image/x-samsung-srw' },
		{ extension: 'x3f', mimeType: 'image/x-sigma-x3f' }
	]) {
		it(`returns the mime type for ${extension}`, () => {
			expect(getFileMimeType({ name: `filename.${extension}` } as File)).toEqual(mimeType);
		});
	}

	it('returns the mime type from the file', () => {
		[
			{
				file: {
					name: 'filename.jpg',
					type: 'image/jpeg'
				},
				result: 'image/jpeg'
			},
			{
				file: {
					name: 'filename.txt',
					type: 'text/plain'
				},
				result: 'text/plain'
			},
			{
				file: {
					name: 'filename.txt',
					type: ''
				},
				result: ''
			}
		].forEach(({ file, result }) => {
			expect(getFileMimeType(file as File)).toEqual(result);
		});
	});
});
