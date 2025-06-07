import {
  All,
  Body,
  Controller,
  Delete,
  Get,
  Head,
  Headers,
  HttpCode,
  HttpStatus,
  Next,
  Options,
  Param,
  Put,
  RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { RouteKey } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { WebDavService } from 'src/services/webdav.service';

@ApiTags('WebDAV')
@Controller(RouteKey.WEBDAV)
export class WebDavController {
  constructor(private service: WebDavService) {}

  // Root resource handlers
  @Get()
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV GET - Retrieve root resource' })
  @ApiResponse({ status: 200, description: 'Root resource retrieved successfully' })
  async getRootResource(
    @Auth() auth: AuthDto,
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
  ): Promise<void> {
    await this.service.handleGet(auth, [], request, response, next);
  }

  @Head()
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV HEAD - Get root resource metadata' })
  @ApiResponse({ status: 200, description: 'Root resource metadata retrieved' })
  async headRootResource(@Auth() auth: AuthDto, @Req() request: Request, @Res() response: Response): Promise<void> {
    await this.service.handleHead(auth, [], request, response);
  }

  @Put()
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV PUT - Create or update root resource' })
  @ApiResponse({ status: 405, description: 'Method not allowed' })
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  putRootResource(
    @Auth() auth: AuthDto,
    @Req() request: RawBodyRequest<Request>,
    @Res() response: Response,
    @Headers() headers: Record<string, string>,
  ) {
    this.service.handlePut(auth, [], request, response, headers);
  }

  @Delete()
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV DELETE - Delete root resource' })
  @ApiResponse({ status: 405, description: 'Method not allowed' })
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  async deleteRootResource(@Auth() auth: AuthDto, @Req() request: Request, @Res() response: Response): Promise<void> {
    await this.service.handleDelete(auth, [], request, response);
  }

  // COPY and MOVE are handled by the @All() decorator for root

  @Get('*path')
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV GET - Retrieve resource' })
  @ApiResponse({ status: 200, description: 'Resource retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async get(
    @Auth() auth: AuthDto,
    @Req() request: Request,
    @Res() response: Response,
    @Next() next: NextFunction,
    @Param('path') path: string[],
  ): Promise<void> {
    await this.service.handleGet(auth, path, request, response, next);
  }

  @Head('*path')
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV HEAD - Get resource metadata' })
  @ApiResponse({ status: 200, description: 'Resource metadata retrieved' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async head(
    @Auth() auth: AuthDto,
    @Req() request: Request,
    @Res() response: Response,
    @Param('path') path: string[],
  ): Promise<void> {
    await this.service.handleHead(auth, path, request, response);
  }

  @Put('*path')
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV PUT - Create or update resource' })
  @ApiResponse({ status: 201, description: 'Resource created' })
  @ApiResponse({ status: 204, description: 'Resource updated' })
  @HttpCode(HttpStatus.NO_CONTENT)
  put(
    @Auth() auth: AuthDto,
    @Req() request: RawBodyRequest<Request>,
    @Res() response: Response,
    @Param('path') path: string[],
    @Headers() headers: Record<string, string>,
  ) {
    this.service.handlePut(auth, path, request, response, headers);
  }

  @Delete('*path')
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV DELETE - Delete resource' })
  @ApiResponse({ status: 204, description: 'Resource deleted' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Auth() auth: AuthDto,
    @Req() request: Request,
    @Res() response: Response,
    @Param('path') path: string[],
  ): Promise<void> {
    await this.service.handleDelete(auth, path, request, response);
  }

  // WebDAV OPTIONS handlers
  @Options()
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV OPTIONS - Get allowed methods for root' })
  @ApiResponse({ status: 200, description: 'Allowed methods returned' })
  handleRootOptions(@Req() request: Request, @Res() response: Response): void {
    this.service.handleOptions(request, response);
  }

  @Options('*path')
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV OPTIONS - Get allowed methods for path' })
  @ApiResponse({ status: 200, description: 'Allowed methods returned' })
  handlePathOptions(@Req() request: Request, @Res() response: Response): void {
    this.service.handleOptions(request, response);
  }

  // WebDAV root methods
  @All()
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV methods for root resource' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 207, description: 'Multi-status response' })
  async handleRootWebDavMethods(
    @Auth() auth: AuthDto,
    @Req() request: Request,
    @Res() response: Response,
    @Headers() headers: Record<string, string>,
    @Body() body: any,
  ): Promise<void> {
    const method = request.method.toUpperCase();

    switch (method) {
      case 'PROPFIND': {
        await this.service.handlePropfind(auth, [], request, response, headers, body);
        break;
      }
      case 'PROPPATCH': {
        this.service.handleProppatch(auth, [], request, response, body);
        break;
      }
      case 'MKCOL': {
        await this.service.handleMkcol(auth, [], request, response);
        break;
      }
      case 'COPY': {
        this.service.handleCopy(auth, [], request, response, headers);
        break;
      }
      case 'MOVE': {
        this.service.handleMove(auth, [], request, response, headers);
        break;
      }
      default: {
        // Let other methods be handled by specific handlers above
        response.status(HttpStatus.METHOD_NOT_ALLOWED).end();
      }
    }
  }

  // Handle all WebDAV methods for paths
  @All('*path')
  @Authenticated({ webdav: true })
  @ApiOperation({ summary: 'WebDAV methods for path resources' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 207, description: 'Multi-status response' })
  @HttpCode(HttpStatus.OK)
  async handleCustomMethod(
    @Auth() auth: AuthDto,
    @Req() request: Request,
    @Res() response: Response,
    @Headers() headers: Record<string, string>,
    @Body() body: any,
    @Param('path') path: string[],
  ): Promise<void> {
    const method = request.method.toUpperCase();

    switch (method) {
      case 'PROPFIND': {
        await this.service.handlePropfind(auth, path, request, response, headers, body);
        break;
      }
      case 'PROPPATCH': {
        this.service.handleProppatch(auth, path, request, response, body);
        break;
      }
      case 'LOCK': {
        this.service.handleLock(auth, path, request, response, headers, body);
        break;
      }
      case 'UNLOCK': {
        this.service.handleUnlock(auth, path, request, response, headers);
        break;
      }
      case 'MKCOL': {
        await this.service.handleMkcol(auth, path, request, response);
        break;
      }
      case 'COPY': {
        this.service.handleCopy(auth, path, request, response, headers);
        break;
      }
      case 'MOVE': {
        this.service.handleMove(auth, path, request, response, headers);
        break;
      }
      default: {
        response.status(HttpStatus.METHOD_NOT_ALLOWED).end();
      }
    }
  }
}
