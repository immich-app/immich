import { Plugin } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import { mapPlugin, PluginSearchDto, PluginUpdateDto } from 'src/dtos/plugin.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';

const plugins: Plugin[] = [
  {
    id: '123',
    name: 'Immich Core Plugin',
    description: 'Core plugins for Immich',
    version: 1,
    isEnabled: true,
    isInstalled: true,
    isTrusted: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    packageId: 'immich-plugin-',
  },
];

export class PluginService extends BaseService {
  async search(auth: AuthDto, dto: PluginSearchDto) {
    await this.requireAccess({ auth, permission: Permission.PluginRead, ids: [] });
    // return this.pluginRepository.search(dto);

    return plugins.map(mapPlugin);
  }

  async update(auth: AuthDto, id: string, dto: PluginUpdateDto) {
    await this.requireAccess({ auth, permission: Permission.PluginUpdate, ids: [id] });
    return this.pluginRepository.update({
      id,
      isEnabled: dto.isEnabled,
    });
  }

  async delete(auth: AuthDto, id: string) {
    await this.requireAccess({ auth, permission: Permission.PluginUpdate, ids: [id] });
    await this.pluginRepository.delete(id);
  }
}
