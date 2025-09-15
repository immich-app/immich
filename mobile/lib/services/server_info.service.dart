import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/debug_print.dart';

final serverInfoServiceProvider = Provider((ref) => ServerInfoService(ref.watch(apiServiceProvider)));

class ServerInfoService {
  final ApiService _apiService;

  const ServerInfoService(this._apiService);

  Future<bool> ping() async {
    try {
      await _apiService.serverInfoApi.pingServer().timeout(const Duration(seconds: 5));
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<ServerDiskInfo?> getDiskInfo() async {
    try {
      final dto = await _apiService.serverInfoApi.getStorage();
      if (dto != null) {
        return ServerDiskInfo.fromDto(dto);
      }
    } catch (e) {
      dPrint(() => "Error [getDiskInfo] ${e.toString()}");
    }
    return null;
  }

  Future<ServerVersion?> getServerVersion() async {
    try {
      final dto = await _apiService.serverInfoApi.getServerVersion();
      if (dto != null) {
        return ServerVersion.fromDto(dto);
      }
    } catch (e) {
      dPrint(() => "Error [getServerVersion] ${e.toString()}");
    }
    return null;
  }

  Future<ServerFeatures?> getServerFeatures() async {
    try {
      final dto = await _apiService.serverInfoApi.getServerFeatures();
      if (dto != null) {
        return ServerFeatures.fromDto(dto);
      }
    } catch (e) {
      dPrint(() => "Error [getServerFeatures] ${e.toString()}");
    }
    return null;
  }

  Future<ServerConfig?> getServerConfig() async {
    try {
      final dto = await _apiService.serverInfoApi.getServerConfig();
      if (dto != null) {
        return ServerConfig.fromDto(dto);
      }
    } catch (e) {
      dPrint(() => "Error [getServerConfig] ${e.toString()}");
    }
    return null;
  }
}
