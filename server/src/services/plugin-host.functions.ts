import { CurrentPlugin } from '@extism/extism';
import { UnauthorizedException } from '@nestjs/common';
import { Updateable } from 'kysely';
import { Permission } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AssetTable } from 'src/schema/tables/asset.table';
import { requireAccess } from 'src/utils/access';

/**
 * Plugin host functions that are exposed to WASM plugins via Extism.
 * These functions allow plugins to interact with the Immich system.
 */
export class PluginHostFunctions {
  constructor(
    private assetRepository: AssetRepository,
    private albumRepository: AlbumRepository,
    private accessRepository: AccessRepository,
    private cryptoRepository: CryptoRepository,
    private logger: LoggingRepository,
    private pluginJwtSecret: string,
  ) {}

  /**
   * Creates Extism host function bindings for the plugin.
   * These are the functions that WASM plugins can call.
   */
  getHostFunctions() {
    return {
      'extism:host/user': {
        updateAsset: (cp: CurrentPlugin, offs: bigint) => this.handleUpdateAsset(cp, offs),
        addAssetToAlbum: (cp: CurrentPlugin, offs: bigint) => this.handleAddAssetToAlbum(cp, offs),
      },
    };
  }

  /**
   * Host function wrapper for updateAsset.
   * Reads the input from the plugin, parses it, and calls the actual update function.
   */
  private async handleUpdateAsset(cp: CurrentPlugin, offs: bigint) {
    const input = JSON.parse(cp.read(offs)!.text());
    await this.updateAsset(input);
  }

  /**
   * Host function wrapper for addAssetToAlbum.
   * Reads the input from the plugin, parses it, and calls the actual add function.
   */
  private async handleAddAssetToAlbum(cp: CurrentPlugin, offs: bigint) {
    const input = JSON.parse(cp.read(offs)!.text());
    await this.addAssetToAlbum(input);
  }

  /**
   * Validates the JWT token and returns the auth context.
   */
  private validateToken(authToken: string): { userId: string } {
    try {
      const auth = this.cryptoRepository.verifyJwt<{ userId: string }>(authToken, this.pluginJwtSecret);
      if (!auth.userId) {
        throw new UnauthorizedException('Invalid token: missing userId');
      }
      return auth;
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Updates an asset with the given properties.
   */
  async updateAsset(input: { authToken: string } & Updateable<AssetTable> & { id: string }) {
    const { authToken, id, ...assetData } = input;

    // Validate token
    const auth = this.validateToken(authToken);

    // Check access to the asset
    await requireAccess(this.accessRepository, {
      auth: { user: { id: auth.userId } } as any,
      permission: Permission.AssetUpdate,
      ids: [id],
    });

    this.logger.log(`Updating asset ${id} -- ${JSON.stringify(assetData)}`);
    await this.assetRepository.update({ id, ...assetData });
  }

  /**
   * Adds an asset to an album.
   */
  async addAssetToAlbum(input: { authToken: string; assetId: string; albumId: string }) {
    const { authToken, assetId, albumId } = input;

    // Validate token
    const auth = this.validateToken(authToken);

    // Check access to both the asset and the album
    await requireAccess(this.accessRepository, {
      auth: { user: { id: auth.userId } } as any,
      permission: Permission.AssetRead,
      ids: [assetId],
    });

    await requireAccess(this.accessRepository, {
      auth: { user: { id: auth.userId } } as any,
      permission: Permission.AlbumUpdate,
      ids: [albumId],
    });

    this.logger.log(`Adding asset ${assetId} to album ${albumId}`);
    await this.albumRepository.addAssetIds(albumId, [assetId]);
    return 0;
  }
}
