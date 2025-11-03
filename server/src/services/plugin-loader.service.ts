import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BaseService } from 'src/services/base.service';

interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description?: string;
  author?: string;
  wasm: {
    path: string;
  };
  triggers?: Array<{
    name: string;
    displayName: string;
    description?: string;
    context: string;
    schema?: any;
    functionName?: string;
  }>;
  filters?: Array<{
    name: string;
    displayName: string;
    description?: string;
    supportedContexts: string[];
    schema?: any;
    functionName: string;
  }>;
  actions?: Array<{
    name: string;
    displayName: string;
    description?: string;
    supportedContexts: string[];
    schema?: any;
    functionName: string;
  }>;
}

@Injectable()
export class PluginLoaderService extends BaseService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    await this.loadPluginsFromManifests();
  }

  async loadPluginsFromManifests(): Promise<void> {
    try {
      const manifestFilePath = path.join(process.cwd(), '..', 'plugins', 'manifest.json');
      const content = await readFile(manifestFilePath, { encoding: 'utf-8' });

      await this.loadPlugin(content);
      this.logger.log('Plugins loaded from manifests successfully.');
    } catch (error) {
      this.logger.error('Error loading plugins from manifests:', error);
    }
  }

  private async loadPlugin(manifestContent: string): Promise<void> {
    try {
      const manifest: PluginManifest = JSON.parse(manifestContent);

      // Here you can add logic to register the plugin in the database
      console.log(`Loaded plugin: ${manifest.name} v${manifest.version}`);
    } catch (error) {
      this.logger.error('Failed to load plugin manifest:', error);
    }
  }
}
