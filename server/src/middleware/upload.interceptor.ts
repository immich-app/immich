import { CallHandler, ExecutionContext, NestInterceptor, UnauthorizedException } from '@nestjs/common';
import { transformException } from '@nestjs/platform-express/multer/multer/multer.utils';
import { NextFunction, RequestHandler, Response } from 'express';
import multer from 'multer';
import { Readable } from 'node:stream';
import { Observable } from 'rxjs';
import { AuthenticatedRequest } from 'src/middleware/auth.guard';
import { v4 } from 'uuid';

type Callback<T> = {
  (error: Error): void;
  (error: null, result: T): void;
};

export type UploadFile = {
  requestId: string;
  fieldName: string;
  originalName: string;
};

export type UploadingFile = UploadFile & {
  stream: Readable;
};

export type UploadedFile = UploadFile & { metadata: UploadMetadata };

export type UploadMetadata = {
  /** folder */
  folder: string;
  /** k filename */
  filename: string;
  /** full path */
  path: string;
  size: number;
  checksum?: Buffer;
};

export type UploadFiles = {
  assetData: Express.Multer.File[];
  sidecarData: Express.Multer.File[];
};

export type UploadRequest = AuthenticatedRequest & {
  requestId: string;
};

type OnRequest = (req: UploadRequest, res: Response) => Promise<Observable<any> | void>;

const mapUploadFile = (req: UploadRequest, file: Express.Multer.File): UploadFile => {
  const originalName = req.body?.filename || Buffer.from(file.originalname, 'latin1').toString('utf8');
  return {
    requestId: req.requestId,
    fieldName: file.fieldname,
    originalName,
  };
};

export const mapUploadedFile = (req: UploadRequest, file: Express.Multer.File): UploadedFile => {
  return { ...mapUploadFile(req, file), metadata: (file as unknown as UploadedFile).metadata };
};

const handle = <T>(target: () => T | Promise<T>, callback: Callback<T>) => {
  void Promise.resolve(true)
    .then(() => target())
    .then((result) => callback(null, result))
    .catch((error) => callback(error));
};

export class UploadInterceptor implements NestInterceptor {
  private handler: RequestHandler;
  private onRequest: OnRequest;

  constructor(
    private options: {
      /** pre-request hook */
      onRequest?: OnRequest;
      configure(instance: multer.Multer): RequestHandler;
      canUpload(req: UploadRequest, file: UploadFile): boolean;
      upload(req: UploadRequest, file: UploadingFile): Promise<UploadMetadata>;
      remove(req: UploadRequest, file: UploadedFile): Promise<void>;
    },
  ) {
    const storage = { _handleFile: this.handleFile.bind(this), _removeFile: this.removeFile.bind(this) };
    this.handler = options.configure(multer({ fileFilter: this.canUpload.bind(this), storage }));
    this.onRequest = options.onRequest ?? (() => Promise.resolve());
  }

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const http = context.switchToHttp();
    const req = http.getRequest<UploadRequest>();
    const res = http.getResponse<Response>();

    if (!req.user) {
      throw new UnauthorizedException();
    }

    req.requestId = v4();

    // hook to preempt the request before file upload
    const response = await this.onRequest(req, res);
    if (response) {
      return response;
    }

    await new Promise<void>((resolve, reject) => {
      const next: NextFunction = (error) => (error ? reject(transformException(error)) : resolve());
      const maybePromise = this.handler(req, res, next);
      Promise.resolve(maybePromise).catch((error) => reject(error));
    });

    return next.handle();
  }

  private canUpload(req: UploadRequest, file: Express.Multer.File, callback: multer.FileFilterCallback) {
    return handle(() => this.options.canUpload(req, mapUploadFile(req, file)), callback);
  }

  private handleFile(req: UploadRequest, file: Express.Multer.File, callback: Callback<UploadMetadata>) {
    return handle<any>(
      () =>
        this.options
          .upload(req, { ...mapUploadFile(req, file), stream: file.stream })
          .then((metadata) => ({ metadata })),
      callback,
    );
  }

  private removeFile(req: UploadRequest, file: Express.Multer.File, callback: Callback<void>) {
    return handle(() => this.options.remove(req, mapUploadedFile(req, file)), callback);
  }
}
