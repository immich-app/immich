import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/infrastructure/repositories/backup.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/debug_print.dart';

final serverInfoServiceProvider = Provider(
  (ref) => ServerInfoService(ref.watch(apiServiceProvider), ref.watch(driftProvider).backupRepository),
);

class ServerInfoService {
  final ApiService _apiService;
  final BackupRepository _backupRepository;

  const ServerInfoService(this._apiService, this._backupRepository);

  Future<ServerDiskInfo?> getDiskInfo() async {
    try {
      final dto = await _apiService.serverInfoApi.getStorage();
      if (dto != null) {
        return ServerDiskInfo.fromDto(dto);
      }
    } catch (e) {
      dPrint(() => "Error [getDiskInfo] $e");
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
      dPrint(() => "Error [getServerVersion] $e");
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
      dPrint(() => "Error [getServerFeatures] $e");
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
      dPrint(() => "Error [getServerConfig] $e");
    }
    return null;
  }

  Future<void> refreshSupportedFileExtensions() async {
    try {
      final dto = await _apiService.serverInfoApi.getSupportedMediaTypes();
      if (dto == null) {
        return;
      }

      final extensions = {...dto.image, ...dto.video};
      if (!setEquals(extensions, SettingsRepository.instance.appConfig.supportedFileExtensions)) {
        await SettingsRepository.instance.write(SettingsKey.supportedFileExtensions, extensions);
        await _backupRepository.clearUnsupported();
      }
    } catch (e) {
      dPrint(() => "Error [refreshSupportedFileExtensions] $e");
    }
  }
}
