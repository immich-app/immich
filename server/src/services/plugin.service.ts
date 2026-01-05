import { Plugin as ExtismPlugin, newPlugin } from '@extism/extism';
import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { join } from 'node:path';
import { Asset, WorkflowAction, WorkflowFilter } from 'src/database';
import { OnEvent, OnJob } from 'src/decorators';
import { PluginManifestDto } from 'src/dtos/plugin-manifest.dto';
import { mapPlugin, PluginResponseDto, PluginTriggerResponseDto } from 'src/dtos/plugin.dto';
import { JobName, JobStatus, PluginTriggerType, QueueName } from 'src/enum';
import { pluginTriggers } from 'src/plugins';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { PluginHostFunctions } from 'src/services/plugin-host.functions';
import { IWorkflowJob, JobItem, JobOf, WorkflowData } from 'src/types';

interface WorkflowContext {
  authToken: string;
  asset: Asset;
}

interface PluginInput<T = unknown> {
  authToken: string;
  config: T;
  data: {
    asset: Asset;
  };
}

@Injectable()
export class PluginService extends BaseService {
  private pluginJwtSecret!: string;
  private loadedPlugins: Map<string, ExtismPlugin> = new Map();
  private hostFunctions!: PluginHostFunctions;

  @OnEvent({ name: 'AppBootstrap' })
  async onBootstrap() {
    this.pluginJwtSecret = this.cryptoRepository.randomBytesAsText(32);

    await this.loadPluginsFromManifests();

    this.hostFunctions = new PluginHostFunctions(
      this.assetRepository,
      this.albumRepository,
      this.accessRepository,
      this.cryptoRepository,
      this.logger,
      this.pluginJwtSecret,
    );

    await this.loadPlugins();
  }

  getTriggers(): PluginTriggerResponseDto[] {
    return pluginTriggers;
  }

  //
  // CRUD operations for plugins
  //
  async getAll(): Promise<PluginResponseDto[]> {
    const plugins = await this.pluginRepository.getAllPlugins();
    return plugins.map((plugin) => mapPlugin(plugin));
  }

  async get(id: string): Promise<PluginResponseDto> {
    const plugin = await this.pluginRepository.getPlugin(id);
    if (!plugin) {
      throw new BadRequestException('Plugin not found');
    }
    return mapPlugin(plugin);
  }

  ///////////////////////////////////////////
  // Plugin Loader
  //////////////////////////////////////////
  async loadPluginsFromManifests(): Promise<void> {
    // Load core plugin
    const { resourcePaths, plugins } = this.configRepository.getEnv();
    const coreManifestPath = `${resourcePaths.corePlugin}/manifest.json`;

    const coreManifest = await this.readAndValidateManifest(coreManifestPath);
    await this.loadPluginToDatabase(coreManifest, resourcePaths.corePlugin);

    this.logger.log(`Successfully processed core plugin: ${coreManifest.name} (version ${coreManifest.version})`);

    // Load external plugins
    if (plugins.external.allow && plugins.external.installFolder) {
      await this.loadExternalPlugins(plugins.external.installFolder);
    }
  }

  private async loadExternalPlugins(installFolder: string): Promise<void> {
    try {
      const entries = await this.pluginRepository.readDirectory(installFolder);

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        const pluginFolder = join(installFolder, entry.name);
        const manifestPath = join(pluginFolder, 'manifest.json');
        try {
          const manifest = await this.readAndValidateManifest(manifestPath);
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
      this.logger.log(`Upserted plugin filter: ${filter.methodName} (ID: ${filter.id})`);
    }

    for (const action of actions) {
      this.logger.log(`Upserted plugin action: ${action.methodName} (ID: ${action.id})`);
    }
  }

  private async readAndValidateManifest(manifestPath: string): Promise<PluginManifestDto> {
    const content = await this.storageRepository.readTextFile(manifestPath);
    const manifestData = JSON.parse(content);
    const manifest = plainToInstance(PluginManifestDto, manifestData);

    await validateOrReject(manifest, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    return manifest;
  }

  ///////////////////////////////////////////
  // Plugin Execution
  ///////////////////////////////////////////
  private async loadPlugins() {
    const plugins = await this.pluginRepository.getAllPlugins();
    for (const plugin of plugins) {
      try {
        this.logger.debug(`Loading plugin: ${plugin.name} from ${plugin.wasmPath}`);

        const extismPlugin = await newPlugin(plugin.wasmPath, {
          useWasi: true,
          functions: this.hostFunctions.getHostFunctions(),
        });

        this.loadedPlugins.set(plugin.id, extismPlugin);
        this.logger.log(`Successfully loaded plugin: ${plugin.name}`);
      } catch (error) {
        this.logger.error(`Failed to load plugin ${plugin.name}:`, error);
      }
    }
  }

  @OnEvent({ name: 'AssetCreate' })
  async handleAssetCreate({ asset }: ArgOf<'AssetCreate'>) {
    await this.handleTrigger(PluginTriggerType.AssetCreate, {
      ownerId: asset.ownerId,
      event: { userId: asset.ownerId, asset },
    });
  }

  private async handleTrigger<T extends PluginTriggerType>(
    triggerType: T,
    params: { ownerId: string; event: WorkflowData[T] },
  ): Promise<void> {
    const workflows = await this.workflowRepository.getWorkflowByOwnerAndTrigger(params.ownerId, triggerType);
    if (workflows.length === 0) {
      return;
    }

    const jobs: JobItem[] = workflows.map((workflow) => ({
      name: JobName.WorkflowRun,
      data: {
        id: workflow.id,
        type: triggerType,
        event: params.event,
      } as IWorkflowJob<T>,
    }));

    await this.jobRepository.queueAll(jobs);
    this.logger.debug(`Queued ${jobs.length} workflow execution jobs for trigger ${triggerType}`);
  }

  @OnJob({ name: JobName.WorkflowRun, queue: QueueName.Workflow })
  async handleWorkflowRun({ id: workflowId, type, event }: JobOf<JobName.WorkflowRun>): Promise<JobStatus> {
    try {
      const workflow = await this.workflowRepository.getWorkflow(workflowId);
      if (!workflow) {
        this.logger.error(`Workflow ${workflowId} not found`);
        return JobStatus.Failed;
      }

      const workflowFilters = await this.workflowRepository.getFilters(workflowId);
      const workflowActions = await this.workflowRepository.getActions(workflowId);

      switch (type) {
        case PluginTriggerType.AssetCreate: {
          const data = event as WorkflowData[PluginTriggerType.AssetCreate];
          const asset = data.asset;

          const authToken = this.cryptoRepository.signJwt({ userId: data.userId }, this.pluginJwtSecret);

          const context = {
            authToken,
            asset,
          };

          const filtersPassed = await this.executeFilters(workflowFilters, context);
          if (!filtersPassed) {
            return JobStatus.Skipped;
          }

          await this.executeActions(workflowActions, context);
          this.logger.debug(`Workflow ${workflowId} executed successfully`);
          return JobStatus.Success;
        }

        case PluginTriggerType.PersonRecognized: {
          this.logger.error('unimplemented');
          return JobStatus.Skipped;
        }

        default: {
          this.logger.error(`Unknown workflow trigger type: ${type}`);
          return JobStatus.Failed;
        }
      }
    } catch (error) {
      this.logger.error(`Error executing workflow ${workflowId}:`, error);
      return JobStatus.Failed;
    }
  }

  private async executeFilters(workflowFilters: WorkflowFilter[], context: WorkflowContext): Promise<boolean> {
    for (const workflowFilter of workflowFilters) {
      const filter = await this.pluginRepository.getFilter(workflowFilter.pluginFilterId);
      if (!filter) {
        this.logger.error(`Filter ${workflowFilter.pluginFilterId} not found`);
        return false;
      }

      const pluginInstance = this.loadedPlugins.get(filter.pluginId);
      if (!pluginInstance) {
        this.logger.error(`Plugin ${filter.pluginId} not loaded`);
        return false;
      }

      const filterInput: PluginInput = {
        authToken: context.authToken,
        config: workflowFilter.filterConfig,
        data: {
          asset: context.asset,
        },
      };

      this.logger.debug(`Calling filter ${filter.methodName} with input: ${JSON.stringify(filterInput)}`);

      const filterResult = await pluginInstance.call(
        filter.methodName,
        new TextEncoder().encode(JSON.stringify(filterInput)),
      );

      if (!filterResult) {
        this.logger.error(`Filter ${filter.methodName} returned null`);
        return false;
      }

      const result = JSON.parse(filterResult.text());
      if (result.passed === false) {
        this.logger.debug(`Filter ${filter.methodName} returned false, stopping workflow execution`);
        return false;
      }
    }

    return true;
  }

  private async executeActions(workflowActions: WorkflowAction[], context: WorkflowContext): Promise<void> {
    for (const workflowAction of workflowActions) {
      const action = await this.pluginRepository.getAction(workflowAction.pluginActionId);
      if (!action) {
        throw new Error(`Action ${workflowAction.pluginActionId} not found`);
      }

      const pluginInstance = this.loadedPlugins.get(action.pluginId);
      if (!pluginInstance) {
        throw new Error(`Plugin ${action.pluginId} not loaded`);
      }

      const actionInput: PluginInput = {
        authToken: context.authToken,
        config: workflowAction.actionConfig,
        data: {
          asset: context.asset,
        },
      };

      this.logger.debug(`Calling action ${action.methodName} with input: ${JSON.stringify(actionInput)}`);

      await pluginInstance.call(action.methodName, JSON.stringify(actionInput));
    }
  }
}
