import { Injectable } from '@nestjs/common';
import { PluginLike } from 'src/interfaces/plugin.interface';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class WorkflowService extends BaseService {
  private plugins?: PluginLike[];

  async init(): Promise<void> {
    const activePlugins = await this.pluginRepository.search({ isEnabled: true });
    const installPaths = activePlugins.map((p) => p.requirePath).filter(Boolean) as string[];
    this.plugins = await Promise.all(installPaths.map((path) => this.pluginRepository.load(path!)));
  }

  // async register() {
  //   const plugins = ['/src/abc'];
  //   for (const pluginModule of plugins) {
  //     // eslint-disable-next-line @typescript-eslint/no-var-requires
  //     try {
  //       const plugin: Plugin = ;
  //       const actions = await plugin.register();
  //       for (const action of actions) {
  //         this.actions[action.id] = action;
  //       }
  //     } catch (error) {
  //       console.error(`Unable to load module: ${pluginModule}`, error);
  //       continue;
  //     }
  //   }
  // }
}
