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
	for (const { mimetype, extension } of [
		{ mimetype: 'image/avif', extension: 'avif' },
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
		/*** The following MIME types are allowed for upload but not returned by getFileMimeType() ***
		{ mimetype: 'image/dng', extension: 'dng' },
		{ mimetype: 'image/ari', extension: 'ari' },
		{ mimetype: 'image/cr2', extension: 'cr2' },
		{ mimetype: 'image/cr3', extension: 'cr3' },
		{ mimetype: 'image/crw', extension: 'crw' },
		{ mimetype: 'image/erf', extension: 'erf' },
		{ mimetype: 'image/raf', extension: 'raf' },
		{ mimetype: 'image/3fr', extension: '3fr' },
		{ mimetype: 'image/fff', extension: 'fff' },
		{ mimetype: 'image/dcr', extension: 'dcr' },
		{ mimetype: 'image/k25', extension: 'k25' },
		{ mimetype: 'image/kdc', extension: 'kdc' },
		{ mimetype: 'image/rwl', extension: 'rwl' },
		{ mimetype: 'image/mrw', extension: 'mrw' },
		{ mimetype: 'image/nef', extension: 'nef' },
		{ mimetype: 'image/orf', extension: 'orf' },
		{ mimetype: 'image/ori', extension: 'ori' },
		{ mimetype: 'image/raw', extension: 'raw' },
		{ mimetype: 'image/pef', extension: 'pef' },
		{ mimetype: 'image/cin', extension: 'cin' },
		{ mimetype: 'image/cap', extension: 'cap' },
		{ mimetype: 'image/iiq', extension: 'iiq' },
		{ mimetype: 'image/srw', extension: 'srw' },
		{ mimetype: 'image/x3f', extension: 'x3f' },
		{ mimetype: 'image/arw', extension: 'arw' },
		{ mimetype: 'image/sr2', extension: 'sr2' },
		{ mimetype: 'image/srf', extension: 'srf' },
**/
		{ mimetype: 'video/3gpp', extension: '3gp' },
		{ mimetype: 'video/mp2t', extension: 'm2ts' },
		{ mimetype: 'video/mp2t', extension: 'mts' },
		{ mimetype: 'video/mp4', extension: 'mp4' },
		{ mimetype: 'video/mpeg', extension: 'mpg' },
		{ mimetype: 'video/quicktime', extension: 'mov' },
		{ mimetype: 'video/webm', extension: 'webm' },
		{ mimetype: 'video/x-flv', extension: 'flv' },
		{ mimetype: 'video/x-matroska', extension: 'mkv' },
		{ mimetype: 'video/x-ms-wmv', extension: 'wmv' },
		{ mimetype: 'video/x-msvideo', extension: 'avi' }
	]) {
		it(`returns the mime type for ${extension}`, () => {
			expect(getFileMimeType({ name: `filename.${extension}` } as File)).toEqual(mimetype);
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
