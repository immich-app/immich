import { CurrentPlugin, newPlugin } from '@extism/extism';
import { Updateable } from 'kysely';
import { resolve } from 'node:path';
import { OnEvent } from 'src/decorators';
import { ArgOf } from 'src/repositories/event.repository';
import { AssetTable } from 'src/schema/tables/asset.table';
import { BaseService } from 'src/services/base.service';

export class PluginService extends BaseService {
  @OnEvent({ name: 'AssetCreate' })
  async handleAssetCreate({ asset }: ArgOf<'AssetCreate'>) {
    console.log(`PluginService.handleAssetCreate: ${asset.id}`);
    const corePath = resolve('../plugins/dist/plugin.wasm');
    const plugin = await newPlugin(corePath, {
      useWasi: true,
      functions: {
        'extism:host/user': {
          updateAsset: (cp: CurrentPlugin, offs: bigint) => this.updateAsset(JSON.parse(cp.read(offs)!.text())),
        },
      },
    });

    const event = { asset };
    await plugin.call('archiveAssetAction', JSON.stringify(event));
  }

  async updateAsset(asset: Updateable<AssetTable> & { id: string }) {
    console.log(`Updating asset ${asset.id} -- ${JSON.stringify({ ...asset, id: undefined })}`);
    await this.assetRepository.update(asset);
  }
}
