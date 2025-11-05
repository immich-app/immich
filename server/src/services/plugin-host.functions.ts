import { CurrentPlugin } from '@extism/extism';
import { Updateable } from 'kysely';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { AssetTable } from 'src/schema/tables/asset.table';

/**
 * Plugin host functions that are exposed to WASM plugins via Extism.
 * These functions allow plugins to interact with the Immich system.
 */
export class PluginHostFunctions {
  constructor(
    private assetRepository: AssetRepository,
    private albumRepository: AlbumRepository,
    private logger: LoggingRepository,
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
  private handleUpdateAsset(cp: CurrentPlugin, offs: bigint) {
    const input = JSON.parse(cp.read(offs)!.text());
    return this.updateAsset(input);
  }

  /**
   * Host function wrapper for addAssetToAlbum.
   * Reads the input from the plugin, parses it, and calls the actual add function.
   */
  private handleAddAssetToAlbum(cp: CurrentPlugin, offs: bigint) {
    const input = JSON.parse(cp.read(offs)!.text());
    return this.addAssetToAlbum(input);
  }

  /**
   * Updates an asset with the given properties.
   */
  async updateAsset(asset: Updateable<AssetTable> & { id: string }) {
    this.logger.log(`Updating asset ${asset.id} -- ${JSON.stringify({ ...asset, id: undefined })}`);
    await this.assetRepository.update(asset);
  }

  /**
   * Adds an asset to an album.
   */
  async addAssetToAlbum({ assetId, albumId }: { assetId: string; albumId: string }) {
    this.logger.log(`Adding asset ${assetId} to album ${albumId}`);
    await this.albumRepository.addAssetIds(albumId, [assetId]);
    return 0;
  }
}
