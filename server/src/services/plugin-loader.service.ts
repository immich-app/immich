import { Injectable } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { OnEvent } from 'src/decorators';
import { PluginManifestDto } from 'src/dtos/plugin-manifest.dto';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class PluginLoaderService extends BaseService {
  @OnEvent({ name: 'AppBootstrap' })
  async onBootstrap() {
    await this.loadPluginsFromManifests();
  }

  async loadPluginsFromManifests(): Promise<void> {
    // Load core plugin
    const { resourcePaths, plugins } = this.configRepository.getEnv();
    const coreManifestPath = `${resourcePaths.corePlugin}/manifest.json`;

    const coreManifest = await this.pluginRepository.readManifest(coreManifestPath);

    await this.validateManifest(coreManifest);
    await this.loadPluginToDatabase(coreManifest, resourcePaths.corePlugin);

    this.logger.log(`Successfully processed core plugin: ${coreManifest.name} (version ${coreManifest.version})`);

    if (plugins.enabled && plugins.installFolder) {
      await this.loadExternalPlugins(plugins.installFolder);
    }
  }

  private async loadExternalPlugins(installFolder: string): Promise<void> {
    try {
      const entries = await readdir(installFolder, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        const pluginFolder = join(installFolder, entry.name);
        const manifestPath = join(pluginFolder, 'manifest.json');
        try {
          const manifest = await this.pluginRepository.readManifest(manifestPath);

          await this.validateManifest(manifest);
          await this.loadPluginToDatabase(manifest, pluginFolder);

          this.logger.log(`Successfully processed external plugin: ${manifest.name} (version ${manifest.version})`);
        } catch (error) {
          this.logger.warn(`Failed to load external plugin from ${manifestPath}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to scan external plugins folder ${installFolder}:`, error);
    }
  }

  private async loadPluginToDatabase(manifest: PluginManifestDto, basePath: string): Promise<void> {
    const currentPlugin = await this.pluginRepository.getPluginByName(manifest.name);
    if (currentPlugin != null && currentPlugin.version === manifest.version) {
      this.logger.log(`Plugin ${manifest.name} is up to date (version ${manifest.version}). Skipping`);
      return;
    }

    const { plugin, filters, actions } = await this.pluginRepository.loadPlugin(manifest, basePath);

    this.logger.log(`Upserted plugin: ${plugin.name} (ID: ${plugin.id}, version: ${plugin.version})`);

    for (const filter of filters) {
      this.logger.log(`Upserted plugin filter: ${filter.name} (ID: ${filter.id})`);
    }

    for (const action of actions) {
      this.logger.log(`Upserted plugin action: ${action.name} (ID: ${action.id})`);
    }
  }

  private async validateManifest(manifest: PluginManifestDto): Promise<void> {
    await validateOrReject(manifest, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
  }
}
