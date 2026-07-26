import { CurrentPlugin } from '@extism/extism';
import {
  WorkflowChanges,
  WorkflowEventData,
  WorkflowEventPayload,
  WorkflowResponse,
  WorkflowTrigger,
} from '@immich/plugin-sdk';
import { HttpException, UnauthorizedException } from '@nestjs/common';
import { join } from 'node:path';
import { DummyValue, OnEvent, OnJob } from 'src/decorators';
import { AlbumsAddAssetsDto, CreateAlbumDto, GetAlbumsDto } from 'src/dtos/album.dto';
import { BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { PluginManifestDto } from 'src/dtos/plugin-manifest.dto';
import {
  BootstrapEventPriority,
  DatabaseLock,
  ImmichEnvironment,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
  WorkflowType,
} from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { AlbumService } from 'src/services/album.service';
import { AssetService } from 'src/services/asset.service';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';

const dummy = () => {
  throw new Error(
    `Calling host functions is not allowed without setting methods[].hostFunctions=true in the plugin manifest`,
  );
};

type ExecuteOptions<T extends WorkflowType> = {
  read: (type: T) => Promise<{ authUserId: string; data: WorkflowEventData<T> }>;
  write: (auth: AuthDto, changes: WorkflowChanges<T>) => Promise<void>;
};

type AssetTrigger = { userId: string; assetId: string; trigger: WorkflowTrigger };

type HostContext = {
  allowedHosts: string[];
};

export class WorkflowExecutionService extends BaseService {
  private jwtSecret!: string;

  @OnEvent({ name: 'AppBootstrap', priority: BootstrapEventPriority.PluginSync, workers: [ImmichWorker.Microservices] })
  async onPluginSync() {
    await this.databaseRepository.withLock(DatabaseLock.PluginImport, async () => {
      // TODO avoid importing plugins in each worker
      // Can this use system metadata similar to geocoding?

      const { environment, resourcePaths, plugins } = this.configRepository.getEnv();
      await this.importFolder(resourcePaths.corePlugin, { force: environment === ImmichEnvironment.Development });

      if (plugins.external.allow && plugins.external.installFolder) {
        await this.importFolders(plugins.external.installFolder);
      }
    });
  }

  @OnEvent({ name: 'AppBootstrap', priority: BootstrapEventPriority.PluginLoad, workers: [ImmichWorker.Microservices] })
  async onPluginLoad() {
    this.jwtSecret = this.cryptoRepository.randomBytesAsText(32);

    const albumService = BaseService.create(AlbumService, this);

    const searchAlbums = this.wrap<[dto: GetAlbumsDto]>((authDto, ctx, args) => albumService.getAll(authDto, ...args));
    const createAlbum = this.wrap<[dto: CreateAlbumDto]>((authDto, ctx, args) => albumService.create(authDto, ...args));
    const addAssetsToAlbum = this.wrap<[id: string, dto: BulkIdsDto]>((authDto, ctx, args) =>
      albumService.addAssets(authDto, ...args),
    );
    const addAssetsToAlbums = this.wrap<[dto: AlbumsAddAssetsDto]>((authDto, ctx, args) =>
      albumService.addAssetsToAlbums(authDto, ...args),
    );
    const httpRequest = this.wrap<
      [
        url: string,
        options?: {
          method?: string;
          headers?: Record<string, string>;
          body?: string;
        },
      ]
    >(async (authDto, context, args) => {
      const hostname = new URL(args[0]).hostname;

      for (const pattern of context.allowedHosts) {
        const regex = new RegExp(pattern.replaceAll('.', String.raw`\.`).replaceAll('*', '.*'));
        if (regex.test(hostname)) {
          // eslint-disable-next-line unicorn/no-invalid-argument-count
          const res = await fetch(...args);

          return {
            ok: res.ok,
            status: res.status,
            body: await res.text(),
          };
        }
      }

      throw new Error('Hostname did not match any listed in methods[].allowedHosts in the plugin manifest');
    });

    const functions = {
      searchAlbums,
      createAlbum,
      addAssetsToAlbum,
      addAssetsToAlbums,
      httpRequest,
    };

    const stubs: typeof functions = {
      searchAlbums: dummy,
      createAlbum: dummy,
      addAssetsToAlbum: dummy,
      addAssetsToAlbums: dummy,
      httpRequest: dummy,
    };

    const plugins = await this.pluginRepository.getForLoad();
    for (const { id, name, version, wasmBytes, methods } of plugins) {
      const isMethod = methods.some(({ hostFunctions }) => !hostFunctions);
      if (isMethod) {
        const label = `${name}@${version}`;
        const key = this.getPluginKey({ id, hostFunctions: false });
        try {
          await this.pluginRepository.load({ key, label, wasmBytes }, { runInWorker: false, functions: stubs });
          this.logger.log(`Loaded plugin: ${label}`);
        } catch (error) {
          this.logger.error(`Unable to load plugin ${label} (${id})`, error);
        }
      }

      const isMethodWithFunction = methods.some(({ hostFunctions }) => hostFunctions);
      if (isMethodWithFunction) {
        const label = `${name}@${version}/worker`;
        const key = this.getPluginKey({ id, hostFunctions: true });
        try {
          await this.pluginRepository.load({ key, label, wasmBytes }, { runInWorker: true, functions });
          this.logger.log(`Loaded plugin with host functions: ${label}`);
        } catch (error) {
          this.logger.error(`Unable to load plugin with host functions ${label} (${id})`, error);
        }
      }
    }
  }

  private getPluginKey({ id, hostFunctions }: { id: string; hostFunctions: boolean }) {
    return id + (hostFunctions ? '/worker' : '');
  }

  private wrap<T>(fn: (authDto: AuthDto, context: HostContext, args: T) => Promise<unknown>) {
    return async (plugin: CurrentPlugin, offset: bigint) => {
      try {
        const handle = plugin.read(offset);
        if (!handle) {
          return plugin.store(
            JSON.stringify({ success: false, status: 400, message: 'Called host function without input' }),
          );
        }

        const { authToken, args } = handle.json() as { authToken: string; args: T };
        if (!authToken) {
          throw new Error('authToken is required');
        }

        const context = plugin.hostContext<HostContext>();
        const authDto = this.validate(authToken);
        const response = await fn(authDto, context, args);

        return plugin.store(JSON.stringify({ success: true, response }));
      } catch (error: Error | any) {
        if (error instanceof HttpException) {
          this.logger.error(`Plugin host exception: ${error}`);
          return plugin.store(
            JSON.stringify({ success: false, status: error.getStatus(), message: error.getResponse() }),
          );
        }

        this.logger.error(`Plugin host exception: ${error}`, error?.stack);

        return plugin.store(
          JSON.stringify({
            success: false,
            status: 500,
            message: `Internal server error: ${error}`,
          }),
        );
      }
    };
  }

  private async importFolders(installFolder: string): Promise<void> {
    try {
      const entries = await this.storageRepository.readdirWithTypes(installFolder);
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        await this.importFolder(join(installFolder, entry.name));
      }
    } catch (error) {
      this.logger.error(`Failed to import plugins folder ${installFolder}:`, error);
    }
  }

  private async importFolder(folder: string, options?: { force?: boolean }) {
    try {
      const manifestPath = join(folder, 'manifest.json');
      const bytes = await this.storageRepository.readFile(manifestPath);
      const contents = bytes.toString('utf8');
      const sha256hash = this.cryptoRepository.hashSha256(contents) as Buffer;

      if (!options?.force) {
        const match = await this.pluginRepository.getByHash(sha256hash);
        if (match) {
          this.logger.log(`Plugin up to date (name=${match.name}@${match.version}, hash=${sha256hash.toString('hex')}`);
          return;
        }
      }

      const dto = JSON.parse(contents);
      const result = PluginManifestDto.schema.safeParse(dto);
      if (!result.success) {
        const issues = result.error.issues.map((issue) => `  - [${issue.path.join('.')}] ${issue.message}`).join('\n');
        this.logger.warn(`Invalid plugin manifest at ${manifestPath}:\n${issues}`);
        return;
      }
      const manifest = result.data;

      const existing = await this.pluginRepository.getByName(manifest.name);
      const wasmPath = `${folder}/${manifest.wasmPath}`;
      const wasmBytes = await this.storageRepository.readFile(wasmPath);

      const plugin = await this.pluginRepository.upsert(
        {
          // NOTE: new properties here need to be added to the on conflict clause in the repository
          enabled: true,
          name: manifest.name,
          title: manifest.title,
          description: manifest.description,
          author: manifest.author,
          version: manifest.version,
          templates: manifest.templates,
          wasmBytes,
          sha256hash,
        },
        manifest.methods,
      );

      if (existing) {
        this.logger.log(
          `Upgraded plugin ${manifest.name} (${plugin.methods.length} methods) from ${existing.version} to ${manifest.version} `,
        );
      } else {
        this.logger.log(
          `Imported plugin ${manifest.name}@${manifest.version} (${plugin.methods.length} methods) from ${folder}`,
        );
      }

      return manifest;
    } catch {
      this.logger.warn(`Failed to import plugin from ${folder}:`);
    }
  }

  private validate(authToken: string): AuthDto {
    try {
      const jwt = this.cryptoRepository.verifyJwt<{ userId: string }>(authToken, this.jwtSecret);
      if (!jwt.userId) {
        throw new UnauthorizedException('Invalid token: missing userId');
      }

      return {
        user: {
          id: jwt.userId,
        },
      } as AuthDto;
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private sign(userId: string) {
    return this.cryptoRepository.signJwt({ userId }, this.jwtSecret);
  }

  @OnEvent({ name: 'AssetCreate' })
  onAssetCreate({ asset: { ownerId: userId, id: assetId } }: ArgOf<'AssetCreate'>) {
    return this.onAssetTrigger({ userId, assetId, trigger: WorkflowTrigger.AssetCreate });
  }

  @OnEvent({ name: 'AssetMetadataExtracted' })
  onAssetMetadataExtracted({ userId, assetId, source }: ArgOf<'AssetMetadataExtracted'>) {
    // prevent loops
    // TODO loop detection in job service directly
    if (source === 'sidecar-write') {
      return;
    }

    return this.onAssetTrigger({ userId, assetId, trigger: WorkflowTrigger.AssetMetadataExtraction });
  }

  private async onAssetTrigger({ userId, assetId, trigger }: AssetTrigger) {
    const items = await this.workflowRepository.search({ userId, trigger });
    await this.jobRepository.queueAll(
      items.map((workflow) => ({
        name: JobName.WorkflowAssetTrigger,
        data: { workflowId: workflow.id, assetId, trigger },
      })),
    );
  }

  @OnJob({ name: JobName.WorkflowAssetTrigger, queue: QueueName.Workflow })
  handleAssetTrigger({ workflowId, assetId }: JobOf<JobName.WorkflowAssetTrigger>) {
    return this.execute(workflowId, (type) => {
      const assetService = BaseService.create(AssetService, this);

      switch (type) {
        case WorkflowType.AssetV1: {
          return {
            read: async () => {
              const asset = await this.workflowRepository.getForAssetV1(assetId);
              return {
                data: { asset } as any,
                authUserId: asset.ownerId,
              };
            },
            write: async (auth, changes) => {
              const asset = changes.asset;
              if (!asset) {
                return;
              }

              await assetService.update(auth, assetId, {
                isFavorite: asset.isFavorite,
                visibility: asset.visibility,
                dateTimeOriginal: asset.exifInfo?.dateTimeOriginal ?? undefined,
                // TODO allow setting to null
                longitude: asset.exifInfo?.longitude ?? undefined,
                // TODO allow setting to null
                latitude: asset.exifInfo?.latitude ?? undefined,
                // TODO allow setting to null
                description: asset.exifInfo?.description ?? undefined,
                rating: asset.exifInfo?.rating,

                // TODO add to update dto
                // make: asset.exifInfo?.make,
                // model: asset.exifInfo?.model,
                // city: asset.exifInfo?.city,
                // state: asset.exifInfo?.state,
                // country: asset.exifInfo?.country,
                // lensModel: asset.exifInfo?.lensModel,
                // fNumber: asset.exifInfo?.fNumber,
                // fps: asset.exifInfo?.fps,
                // iso: asset.exifInfo?.iso,
              });
            },
          } satisfies ExecuteOptions<typeof type>;
        }
      }
    });
  }

  private async execute<T extends WorkflowType>(
    workflowId: string,
    getHandler: (type: T) => ExecuteOptions<T> | undefined,
  ) {
    const workflow = await this.workflowRepository.getForWorkflowRun(workflowId);
    if (!workflow) {
      return;
    }

    // TODO infer from steps
    let type: T | undefined;
    for (const targetType of Object.values(WorkflowType)) {
      const isMissing = workflow.steps.some((step) => !step.types.includes(targetType));
      if (!isMissing) {
        type = targetType as unknown as T;
        break;
      }
    }

    if (!type) {
      throw new Error('Unable to infer workflow event type from steps');
    }

    const handler = getHandler(type);
    if (!handler) {
      this.logger.error(`Misconfigured workflow ${workflowId}: no handler for type ${type}`);
      return;
    }

    try {
      const { read, write } = handler;
      const readResult = await read(type);
      let data = readResult.data;
      for (const step of workflow.steps) {
        const payload: WorkflowEventPayload<typeof type> = {
          trigger: workflow.trigger,
          type,
          config: step.config ?? {},
          workflow: {
            id: workflowId,
            authToken: this.sign(readResult.authUserId),
            stepId: step.id,
          },
          data,
        };

        const context: HostContext = {
          allowedHosts: step.allowedHosts,
        };

        if (step.methodName.startsWith('noop')) {
          continue;
        }

        const result = await this.pluginRepository.callMethod<WorkflowResponse<T>>(
          {
            pluginKey: this.getPluginKey({ id: step.pluginId, hostFunctions: step.hostFunctions }),
            methodName: step.methodName,
          },
          payload,
          context,
        );
        if (result?.changes) {
          await write(
            {
              user: {
                id: readResult.authUserId,
              },
              session: {
                id: DummyValue.UUID,
                hasElevatedPermission: true,
              },
            } as AuthDto,
            result.changes,
          );
          ({ data } = await read(type));
        }

        if (result?.config) {
          await this.workflowRepository.updateStep(step.id, { config: result.config });
        }

        const shouldContinue = result?.workflow?.continue ?? true;
        if (!shouldContinue) {
          break;
        }
      }

      this.logger.debug(`Workflow ${workflowId} executed successfully`);
    } catch (error) {
      this.logger.error(`Error executing workflow ${workflowId}:`, error);
      return JobStatus.Failed;
    }
  }
}
