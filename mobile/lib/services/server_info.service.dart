import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/server_info/server_config.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/models/server_info/server_features.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';

final serverInfoServiceProvider = Provider(
  (ref) => ServerInfoService(
    ref.watch(apiServiceProvider),
  ),
);

class ServerInfoService {
  final ApiService _apiService;

  const ServerInfoService(this._apiService);

  Future<ServerDiskInfo?> getDiskInfo() async {
    try {
      final dto = await _apiService.serverInfoApi.getStorage();
      if (dto != null) {
        return ServerDiskInfo.fromDto(dto);
      }
    } catch (e) {
      debugPrint("Error [getDiskInfo] ${e.toString()}");
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
      debugPrint("Error [getServerVersion] ${e.toString()}");
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
      debugPrint("Error [getServerFeatures] ${e.toString()}");
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
      debugPrint("Error [getServerConfig] ${e.toString()}");
    }
    return null;
  }
}
