import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import * as mkdirp from 'mkdirp';
import { DiskStorageOptions, StorageEngine } from 'multer';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ParsedQs } from 'qs';

type GetFileNameFn = (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => void;
type GetDestFn = (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => void;

export interface ExtendedDiskStorageOptions extends DiskStorageOptions {
}

function getFilename(
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void
) {
  crypto.randomBytes(16, function (err, raw) {
    cb(err, err ? '' : raw.toString('hex'));
  });
}

function getDestination(
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, destination: string) => void
) {
  cb(null, os.tmpdir())
}

class ExtendedDiskStorage implements StorageEngine {
  private _getFilenameFn: GetFileNameFn;
  private _getDestinationFn: GetDestFn;

  constructor(opts: ExtendedDiskStorageOptions) {
    this._getFilenameFn = (opts.filename || getFilename);

    if (typeof opts.destination === 'string') {
      mkdirp.sync(opts.destination);
      this._getDestinationFn = ($0, $1, cb) => {
        cb(null, opts.destination as string);
      };
    } else {
      this._getDestinationFn = (opts.destination || getDestination);
    }
  }

  public _handleFile(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, file: Express.Multer.File, cb: (error?: any, info?: Partial<Express.Multer.File> | undefined) => void): void {
    const that = this;

    that._getDestinationFn(req, file, (err, destination) => {
      if (err) return cb(err);

      that._getFilenameFn(req, file, (err, filename) => {
        if (err) return cb(err);

        const finalPath = path.join(destination, filename);
        const outStream = fs.createWriteStream(finalPath);
        const sha1Hash = crypto.createHash('sha1');

        file.stream.on('data', (chunk) => {
          sha1Hash.update(chunk);
        });
        file.stream.pipe(outStream);
        outStream.on('error', cb);
        outStream.on('finish', () => {
          const sha1Hex = sha1Hash.digest('hex');

          sha1Hash.destroy();
          cb(null, {
            destination: destination,
            filename: filename,
            path: finalPath,
            size: outStream.bytesWritten,
            checksum: sha1Hex,
          });
        });
      })
    })
  }

  public _removeFile(req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, file: Express.Multer.File, cb: (error: Error | null) => void): void {
    const path = file.path;
    const refFile = file as any; // make intellisense happy

    delete refFile.destination;
    delete refFile.filename;
    delete refFile.path;

    fs.unlink(path, cb);
  }
}

export const diskStorage = (opts: ExtendedDiskStorageOptions) => new ExtendedDiskStorage(opts);
