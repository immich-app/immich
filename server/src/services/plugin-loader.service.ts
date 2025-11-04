import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PluginManifestDto } from 'src/dtos/plugin-manifest.dto';
import { PluginActionName, PluginFilterName } from 'src/schema/tables/plugin.table';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class PluginLoaderService extends BaseService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    await this.loadPluginsFromManifests();
  }

  async loadPluginsFromManifests(): Promise<void> {
    try {
      const manifestFilePath = path.join(process.cwd(), '..', 'plugins', 'manifest.json');
      const content = await readFile(manifestFilePath, { encoding: 'utf-8' });

      const manifestData = JSON.parse(content);
      const manifest = plainToInstance(PluginManifestDto, manifestData);

      await this.validateManifest(manifest);

      await this.loadPluginToDatabase(manifest);

      this.logger.log(`Successfully loaded plugin: ${manifest.name} (version ${manifest.version})`);
    } catch (error) {
      this.logger.error('Error loading plugins from manifests:', error);
    }
  }

  private async loadPluginToDatabase(manifest: PluginManifestDto): Promise<void> {
    const currentPlugin = await this.pluginRepository.getPluginByName(manifest.name);
    if (currentPlugin != null && currentPlugin.version === manifest.version) {
      this.logger.log(`Plugin ${manifest.name} is up to date (version ${manifest.version}). Skipping.`);

      return;
    }

    // TODO: How to perform the subsequent upsert operations in a transaction from the service layer?
    const plugin = await this.pluginRepository.upsertPlugin({
      name: manifest.name,
      displayName: manifest.displayName,
      description: manifest.description,
      author: manifest.author,
      version: manifest.version,
      manifestPath: manifest.wasm.path,
    });

    if (manifest.filters) {
      for (const filter of manifest.filters) {
        const filterResult = await this.pluginRepository.upsertFilter({
          pluginId: plugin.id,
          name: filter.name as PluginFilterName,
          displayName: filter.displayName,
          description: filter.description,
          supportedContexts: filter.supportedContexts,
          functionName: filter.functionName,
          schema: filter.schema,
        });

        this.logger.log(`Upserted plugin filter: ${filterResult.name} (ID: ${filterResult.id})`);
      }
    }

    if (manifest.actions) {
      for (const action of manifest.actions) {
        const actionResult = await this.pluginRepository.upsertAction({
          pluginId: plugin.id,
          name: action.name as PluginActionName,
          displayName: action.displayName,
          description: action.description,
          supportedContexts: action.supportedContexts,
          functionName: action.functionName,
          schema: action.schema,
        });

        this.logger.log(`Upserted plugin action: ${actionResult.name} (ID: ${actionResult.id})`);
      }
    }
  }

  private async validateManifest(manifest: PluginManifestDto): Promise<void> {
    await validateOrReject(manifest, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  }
}
