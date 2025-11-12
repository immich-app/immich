import { Injectable } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
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
    const { plugins } = this.configRepository.getEnv();

    for (const plugin of plugins) {
      if (!plugin.enabled) {
        continue;
      }

      this.logger.debug(`Loading plugin from manifest file at: ${plugin.manifestPath}.`);
      const manifest = await this.pluginRepository.readManifest(plugin.manifestPath);

      await this.validateManifest(manifest);
      await this.loadPluginToDatabase(manifest);

      this.logger.log(`Successfully processed plugin: ${manifest.name} (version ${manifest.version})`);
    }
  }

  private async loadPluginToDatabase(manifest: PluginManifestDto): Promise<void> {
    const currentPlugin = await this.pluginRepository.getPluginByName(manifest.name);
    if (currentPlugin != null && currentPlugin.version === manifest.version) {
      this.logger.log(`Plugin ${manifest.name} is up to date (version ${manifest.version}). Skipping`);
      return;
    }

    const { plugin, filters, actions } = await this.pluginRepository.loadPlugin(manifest);

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
