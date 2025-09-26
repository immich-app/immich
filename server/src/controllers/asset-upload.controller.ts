import { All, BadRequestException, Body, Controller, HttpException, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Request, Response } from 'express';
import {
  TusdHookRequestDto,
  TusdHookRequestType,
  TusdHookResponseDto,
  TusdPreCreateEventDto,
  TusdPreFinishEventDto,
} from 'src/dtos/upload.dto';
import { Permission } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AssetUploadService } from 'src/services/asset-upload.service';
import { AuthService } from 'src/services/auth.service';

@ApiTags('Upload')
@Controller('upload')
export class AssetUploadController {
  constructor(
    private authService: AuthService,
    private uploadService: AssetUploadService,
    private logger: LoggingRepository,
  ) {
    logger.setContext(AssetUploadController.name);
  }

  // Proxies chunked upload requests to the tusd server.
  // Auth is handled in the pre-create and pre-finish hooks from tusd.
  @All('asset{/*all}')
  handleChunks(@Req() request: Request, @Res() response: Response): Promise<unknown> {
    return this.uploadService.proxyChunks(request, response);
  }

  // This controller handles webhooks from the tusd server.
  // See https://tus.github.io/tusd/advanced-topics/hooks/ for more information.
  @Post('hook')
  async processHook(@Body() payload: TusdHookRequestDto): Promise<TusdHookResponseDto> {
    const request = payload.Event.HTTPRequest;
    const lowerCaseHeaders: Record<string, string> = {};
    for (const [key, [value]] of Object.entries(request.Header)) {
      lowerCaseHeaders[key.toLowerCase()] = value;
    }

    try {
      const auth = await this.authService.authenticate({
        headers: lowerCaseHeaders,
        queryParams: {},
        metadata: { adminRoute: false, sharedLinkRoute: false, permission: Permission.AssetUpload, uri: request.URI },
      });

      switch (payload.Type) {
        case TusdHookRequestType.PreCreate: {
          const dto = plainToInstance(TusdPreCreateEventDto, payload.Event);
          const errors = validateSync(dto, { whitelist: true });
          if (errors.length > 0) {
            throw new BadRequestException('Invalid payload');
          }
          return await this.uploadService.handlePreCreate(auth, dto, lowerCaseHeaders);
        }
        case TusdHookRequestType.PreFinish: {
          const dto = plainToInstance(TusdPreFinishEventDto, payload.Event);
          const errors = validateSync(dto, { whitelist: true });
          if (errors.length > 0) {
            throw new BadRequestException('Invalid payload');
          }
          return await this.uploadService.handlePreFinish(auth, dto);
        }
        default: {
          throw new Error(`Unhandled hook type: ${payload.Type}`);
        }
      }
    } catch (error: any) {
      if (error instanceof HttpException) {
        return { RejectUpload: true, HTTPResponse: { StatusCode: error.getStatus(), Body: error.message } };
      }
      this.logger.error('Error processing upload hook', error);
      return { RejectUpload: true, HTTPResponse: { StatusCode: 500 } };
    }
  }
}
