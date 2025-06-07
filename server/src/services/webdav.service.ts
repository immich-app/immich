import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { WebDavResourceDto } from 'src/dtos/webdav.dto';
import { AssetType, CacheControl, Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { requireAccess } from 'src/utils/access';
import { ImmichFileResponse, sendFile } from 'src/utils/file';
import { mimeTypes } from 'src/utils/mime-types';

interface ParsedPath {
  path: string;
  segments: string[];
  isRoot: boolean;
  isAlbum: boolean;
  albumName?: string;
  assetFileName?: string;
}

@Injectable()
export class WebDavService extends BaseService {
  async handleGet(
    auth: AuthDto,
    resourcePathSegments: string[],
    request: Request,
    response: Response,
    next: () => void,
  ): Promise<void> {
    try {
      // Convert path segments array to parsed path structure
      const parsedPath = this.parsePathSegments(resourcePathSegments);

      // Check if this is a collection or file request
      if (parsedPath.isRoot || parsedPath.isAlbum) {
        // Return directory listing as HTML
        const resources = await this.listResources(auth, parsedPath);
        const html = this.generateDirectoryListing(parsedPath.path, resources);
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.status(HttpStatus.OK).send(html);
      } else {
        // Return file content
        const asset = await this.getAssetByPath(auth, parsedPath);
        if (!asset) {
          throw new NotFoundException('Resource not found');
        }

        return sendFile(
          response,
          next,
          // eslint-disable-next-line @typescript-eslint/require-await
          async () =>
            new ImmichFileResponse({
              path: asset.originalPath,
              contentType: mimeTypes.lookup(asset.originalPath) || 'application/octet-stream',
              cacheControl: CacheControl.PRIVATE_WITH_CACHE,
              fileName: asset.originalFileName,
            }),
          this.logger,
        );
      }
    } catch (error) {
      this.handleError(error, response);
    }
  }

  async handleHead(
    auth: AuthDto,
    resourcePathSegments: string[],
    _request: Request,
    response: Response,
  ): Promise<void> {
    try {
      const parsedPath = this.parsePathSegments(resourcePathSegments);
      const resource = await this.getResourceInfo(auth, parsedPath);

      if (!resource) {
        response.status(HttpStatus.NOT_FOUND).end();
        return;
      }

      response.setHeader('ETag', resource.etag || `"${resource.modified.getTime()}"`);
      response.setHeader('Last-Modified', resource.modified.toUTCString());

      if (!resource.isCollection) {
        response.setHeader('Content-Length', resource.size.toString());
        response.setHeader('Content-Type', resource.contentType || 'application/octet-stream');
      }

      response.status(HttpStatus.OK).end();
    } catch (error) {
      this.handleError(error, response);
    }
  }

  handlePut(
    _auth: AuthDto,
    resourcePathSegments: string[],
    _request: Request,
    response: Response,
    _headers: Record<string, string>,
  ): void {
    try {
      const parsedPath = this.parsePathSegments(resourcePathSegments);

      if (parsedPath.isRoot || parsedPath.isAlbum) {
        throw new BadRequestException('Cannot PUT to a collection');
      }

      // For now, we'll return method not allowed as upload is complex
      response.status(HttpStatus.METHOD_NOT_ALLOWED).end();
    } catch (error) {
      this.handleError(error, response);
    }
  }

  async handleDelete(
    auth: AuthDto,
    resourcePathSegments: string[],
    _request: Request,
    response: Response,
  ): Promise<void> {
    try {
      const parsedPath = this.parsePathSegments(resourcePathSegments);

      if (parsedPath.isRoot) {
        throw new BadRequestException('Cannot delete root collection');
      }

      if (parsedPath.assetFileName && parsedPath.albumName) {
        // Delete asset (soft delete by setting deletedAt)
        const asset = await this.getAssetByFileName(auth, parsedPath.albumName, parsedPath.assetFileName);
        if (!asset) {
          throw new NotFoundException('Asset not found');
        }

        await requireAccess(this.accessRepository, {
          auth,
          permission: Permission.ASSET_DELETE,
          ids: [asset.id],
        });
        await this.assetRepository.update({ id: asset.id, deletedAt: new Date() });
        response.status(HttpStatus.NO_CONTENT).end();
      } else if (parsedPath.albumName) {
        // Delete album by name
        const album = await this.getAlbumByName(auth, parsedPath.albumName);
        if (!album) {
          throw new NotFoundException('Album not found');
        }

        await requireAccess(this.accessRepository, {
          auth,
          permission: Permission.ALBUM_DELETE,
          ids: [album.id],
        });
        await this.albumRepository.delete(album.id);
        response.status(HttpStatus.NO_CONTENT).end();
      } else {
        throw new NotFoundException('Resource not found');
      }
    } catch (error) {
      this.handleError(error, response);
    }
  }

  async handleMkcol(
    auth: AuthDto,
    resourcePathSegments: string[],
    _request: Request,
    response: Response,
  ): Promise<void> {
    try {
      const parsedPath = this.parsePathSegments(resourcePathSegments);

      if (parsedPath.isRoot) {
        throw new BadRequestException('Collection already exists');
      }

      // Create new album
      const albumName = parsedPath.segments.at(-1);
      const album = await this.albumRepository.create(
        {
          ownerId: auth.user.id,
          albumName,
          description: '',
        },
        [],
        [],
      );

      response.setHeader('Location', `/webdav/${album.id}`);
      response.status(HttpStatus.CREATED).end();
    } catch (error) {
      this.handleError(error, response);
    }
  }

  handleCopy(
    _auth: AuthDto,
    _sourcePathSegments: string[],
    _request: Request,
    response: Response,
    headers: Record<string, string>,
  ) {
    try {
      const destination = headers['destination'];
      if (!destination) {
        throw new BadRequestException('Destination header required');
      }

      // For now, return method not allowed
      response.status(HttpStatus.METHOD_NOT_ALLOWED).end();
    } catch (error) {
      this.handleError(error, response);
    }
  }

  handleMove(
    _auth: AuthDto,
    _sourcePathSegments: string[],
    _request: Request,
    response: Response,
    headers: Record<string, string>,
  ) {
    try {
      const destination = headers['destination'];
      if (!destination) {
        throw new BadRequestException('Destination header required');
      }

      // For now, return method not allowed
      response.status(HttpStatus.METHOD_NOT_ALLOWED).end();
    } catch (error) {
      this.handleError(error, response);
    }
  }

  handleOptions(_request: Request, response: Response) {
    response.setHeader(
      'Allow',
      'OPTIONS, GET, HEAD, PUT, DELETE, PROPFIND, PROPPATCH, MKCOL, COPY, MOVE, LOCK, UNLOCK',
    );
    response.setHeader('DAV', '1, 2');
    response.setHeader('MS-Author-Via', 'DAV');
    response.status(HttpStatus.OK).end();
  }

  async handlePropfind(
    auth: AuthDto,
    resourcePathSegments: string[],
    _request: Request,
    response: Response,
    headers: Record<string, string>,
    _body: unknown,
  ): Promise<void> {
    try {
      const depth = headers['depth'] || 'infinity';
      const parsedPath = this.parsePathSegments(resourcePathSegments);

      const resources: WebDavResourceDto[] = [];

      // Get current resource
      const currentResource = await this.getResourceInfo(auth, parsedPath);
      if (currentResource) {
        resources.push(currentResource);

        // If depth > 0 and it's a collection, get children
        if (depth !== '0' && currentResource.isCollection) {
          const children = await this.listResources(auth, parsedPath);
          resources.push(...children);
        }
      }

      const xml = this.generatePropfindResponse(resources);
      response.setHeader('Content-Type', 'application/xml; charset=utf-8');
      response.status(HttpStatus.MULTI_STATUS).send(xml);
    } catch (error) {
      this.handleError(error, response);
    }
  }

  handleProppatch(
    _auth: AuthDto,
    resourcePathSegments: string[],
    _request: Request,
    response: Response,
    _body: unknown,
  ) {
    try {
      // For now, return success but don't actually update properties
      const xml =
        '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<D:multistatus xmlns:D="DAV:">\n' +
        '  <D:response>\n' +
        `    <D:href>/${resourcePathSegments.join('/')}</D:href>\n` +
        '    <D:propstat>\n' +
        '      <D:status>HTTP/1.1 200 OK</D:status>\n' +
        '    </D:propstat>\n' +
        '  </D:response>\n' +
        '</D:multistatus>';

      response.setHeader('Content-Type', 'application/xml; charset=utf-8');
      response.status(HttpStatus.MULTI_STATUS).send(xml);
    } catch (error) {
      this.handleError(error, response);
    }
  }

  handleLock(
    _auth: AuthDto,
    _resourcePathSegments: string[],
    _request: Request,
    response: Response,
    _headers: Record<string, string>,
    _body: unknown,
  ) {
    try {
      // WebDAV locking not implemented - return 501
      response.status(HttpStatus.NOT_IMPLEMENTED).end();
    } catch (error) {
      this.handleError(error, response);
    }
  }

  handleUnlock(
    _auth: AuthDto,
    _resourcePathSegments: string[],
    _request: Request,
    response: Response,
    _headers: Record<string, string>,
  ) {
    try {
      // WebDAV locking not implemented - return 501
      response.status(HttpStatus.NOT_IMPLEMENTED).end();
    } catch (error) {
      this.handleError(error, response);
    }
  }

  // Helper methods
  private async getAlbumByName(auth: AuthDto, albumName: string) {
    const albums = await this.albumRepository.getOwned(auth.user.id);
    return albums.find((album) => album.albumName === albumName);
  }

  private async getAssetByFileName(auth: AuthDto, albumName: string, fileName: string) {
    const album = await this.getAlbumByName(auth, albumName);
    if (!album) {
      return null;
    }

    await requireAccess(this.accessRepository, { auth, permission: Permission.ALBUM_READ, ids: [album.id] });

    // Get album with assets to search by filename
    const albumWithAssets = await this.albumRepository.getById(album.id, { withAssets: true });
    if (!albumWithAssets?.assets) {
      return null;
    }

    // Find asset by original filename
    const asset = albumWithAssets.assets.find((asset) => asset.originalFileName === fileName);

    if (!asset) {
      return null;
    }

    await requireAccess(this.accessRepository, { auth, permission: Permission.ASSET_READ, ids: [asset.id] });

    return asset;
  }

  private parsePathSegments(segments: string[]): ParsedPath {
    // Filter out empty segments
    const cleanSegments = segments.filter(Boolean);

    return {
      path: '/' + cleanSegments.join('/'),
      segments: cleanSegments,
      isRoot: cleanSegments.length === 0,
      isAlbum: cleanSegments.length === 1,
      albumName: cleanSegments.length > 0 ? cleanSegments[0] : undefined,
      assetFileName: cleanSegments.length >= 2 ? cleanSegments[1] : undefined,
    };
  }

  private async getResourceInfo(auth: AuthDto, parsedPath: ParsedPath): Promise<WebDavResourceDto | null> {
    if (parsedPath.isRoot) {
      return {
        name: '/',
        path: '/',
        size: 0,
        created: new Date(),
        modified: new Date(),
        isCollection: true,
      };
    }

    if (parsedPath.albumName && !parsedPath.assetFileName) {
      // Get album info by name
      const album = await this.getAlbumByName(auth, parsedPath.albumName);
      if (!album) {
        return null;
      }

      await requireAccess(this.accessRepository, { auth, permission: Permission.ALBUM_READ, ids: [album.id] });

      return {
        name: album.albumName,
        path: parsedPath.path,
        size: 0,
        created: album.createdAt,
        modified: album.updatedAt,
        isCollection: true,
      };
    }

    if (parsedPath.assetFileName && parsedPath.albumName) {
      // Get asset by filename within the album
      const asset = await this.getAssetByFileName(auth, parsedPath.albumName, parsedPath.assetFileName);
      if (!asset) {
        return null;
      }

      // Get asset with exif info for file size
      const assetWithExif = await this.assetRepository.getById(asset.id, { exifInfo: true });

      return {
        name: asset.originalFileName || asset.id,
        path: parsedPath.path,
        size: assetWithExif?.exifInfo?.fileSizeInByte || 0,
        created: asset.createdAt,
        modified: asset.updatedAt,
        isCollection: false,
        contentType:
          asset.type === AssetType.IMAGE
            ? 'image/jpeg'
            : asset.type === AssetType.VIDEO
              ? 'video/mp4'
              : 'application/octet-stream',
        etag: `"${asset.checksum}"`,
      };
    }

    return null;
  }

  private async listResources(auth: AuthDto, parsedPath: ParsedPath): Promise<WebDavResourceDto[]> {
    const resources: WebDavResourceDto[] = [];

    if (parsedPath.isRoot) {
      // List albums owned by the user
      const albums = await this.albumRepository.getOwned(auth.user.id);
      for (const album of albums) {
        resources.push({
          name: album.albumName,
          path: `/${album.albumName}`,
          size: 0,
          created: album.createdAt,
          modified: album.updatedAt,
          isCollection: true,
        });
      }
    } else if (parsedPath.albumName) {
      // List assets in album by name
      const album = await this.getAlbumByName(auth, parsedPath.albumName);
      if (album) {
        await requireAccess(this.accessRepository, { auth, permission: Permission.ALBUM_READ, ids: [album.id] });

        // Get album with assets
        const albumWithAssets = await this.albumRepository.getById(album.id, { withAssets: true });
        if (!albumWithAssets?.assets) {
          return resources;
        }

        for (const asset of albumWithAssets.assets) {
          resources.push({
            name: asset.originalFileName || asset.id,
            path: `/${album.albumName}/${asset.originalFileName || asset.id}`,
            size: asset.exifInfo?.fileSizeInByte || 0,
            created: asset.createdAt,
            modified: asset.updatedAt,
            isCollection: false,
            contentType:
              asset.type === AssetType.IMAGE
                ? 'image/jpeg'
                : asset.type === AssetType.VIDEO
                  ? 'video/mp4'
                  : 'application/octet-stream',
            etag: `"${asset.checksum}"`,
          });
        }
      }
    }

    return resources;
  }

  private async getAssetByPath(auth: AuthDto, parsedPath: ParsedPath) {
    if (!parsedPath.assetFileName || !parsedPath.albumName) {
      return null;
    }

    // Get asset by filename within the album
    const asset = await this.getAssetByFileName(auth, parsedPath.albumName, parsedPath.assetFileName);
    if (!asset) {
      return null;
    }

    // Get asset with exif info for streaming
    return await this.assetRepository.getById(asset.id, { exifInfo: true });
  }

  private generateDirectoryListing(dirPath: string, resources: WebDavResourceDto[]): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>Index of ${dirPath}</title>
  <style>
    body { font-family: monospace; margin: 20px; }
    h1 { font-size: 1.5em; }
    table { border-collapse: collapse; }
    th, td { padding: 5px 15px; text-align: left; }
    tr:hover { background-color: #f5f5f5; }
    a { text-decoration: none; color: #0066cc; }
    a:hover { text-decoration: underline; }
    .size { text-align: right; }
  </style>
</head>
<body>
  <h1>Index of ${dirPath}</h1>
  <table>
    <tr>
      <th>Name</th>
      <th>Last Modified</th>
      <th class="size">Size</th>
    </tr>`;

    if (dirPath !== '/') {
      html += `
    <tr>
      <td><a href="../">../</a></td>
      <td>-</td>
      <td class="size">-</td>
    </tr>`;
    }

    for (const resource of resources) {
      const name = resource.isCollection ? resource.name + '/' : resource.name;
      const size = resource.isCollection ? '-' : this.formatBytes(resource.size);
      // For collections, use the last segment of the path (the name), for files use the name
      const pathSegments = resource.path.split('/').filter(Boolean);
      const href = resource.isCollection ? (pathSegments.length > 0 ? pathSegments.at(-1) + '/' : '') : resource.name;
      html += `
    <tr>
      <td><a href="${href}">${name}</a></td>
      <td>${new Date(resource.modified).toISOString().split('T')[0]}</td>
      <td class="size">${size}</td>
    </tr>`;
    }

    html += `
  </table>
</body>
</html>`;

    return html;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generatePropfindResponse(resources: WebDavResourceDto[]): string {
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += '<D:multistatus xmlns:D="DAV:">\n';

    for (const resource of resources) {
      xml += '  <D:response>\n';
      xml += `    <D:href>/api/webdav/${resource.path}</D:href>\n`;
      xml += '    <D:propstat>\n';
      xml += '      <D:prop>\n';

      if (resource.isCollection) {
        xml += '        <D:resourcetype><D:collection/></D:resourcetype>\n';
      } else {
        xml += '        <D:resourcetype/>\n';
        xml += `        <D:getcontentlength>${resource.size}</D:getcontentlength>\n`;
        xml += `        <D:getcontenttype>${resource.contentType || 'application/octet-stream'}</D:getcontenttype>\n`;
      }

      xml += `        <D:getlastmodified>${new Date(resource.modified).toUTCString()}</D:getlastmodified>\n`;
      xml += `        <D:creationdate>${new Date(resource.created).toISOString()}</D:creationdate>\n`;

      if (resource.etag) {
        xml += `        <D:getetag>${resource.etag}</D:getetag>\n`;
      }

      xml += '      </D:prop>\n';
      xml += '      <D:status>HTTP/1.1 200 OK</D:status>\n';
      xml += '    </D:propstat>\n';
      xml += '  </D:response>\n';
    }

    xml += '</D:multistatus>';
    return xml;
  }

  private handleError(error: unknown, response: Response): void {
    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      const status = error.getStatus();
      response.status(status).send(error.message);
    } else if (error && typeof error === 'object' && 'status' in error && typeof (error as any).status === 'number') {
      response.status((error as any).status).send((error as any).message || 'Error');
    } else {
      this.logger.error('WebDAV error', error);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Internal Server Error');
    }
  }
}
