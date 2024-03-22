import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/server_info/server_config.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_disk_info.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_features.model.dart';
import 'package:immich_mobile/shared/models/server_info/server_version.model.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';

final serverInfoServiceProvider = Provider(
  (ref) => ServerInfoService(
    ref.watch(apiServiceProvider),
  ),
);

class ServerInfoService {
  final _log = Logger("ServerInfoService");
  final ApiService _apiService;

  ServerInfoService(this._apiService);

  Future<ServerDiskInfo?> getServerInfo() async {
    try {
      final dto = await _apiService.serverInfoApi.getServerInfo();
      if (dto != null) {
        return ServerDiskInfo.fromDto(dto);
      }
    } catch (error, stack) {
      _log.severe("Cannot get server info: ${error.toString()}", error, stack);
    }
    return null;
  }

  Future<ServerVersion?> getServerVersion() async {
    try {
      final dto = await _apiService.serverInfoApi.getServerVersion();
      if (dto != null) {
        return ServerVersion.fromDto(dto);
      }
    } catch (error, stack) {
      _log.severe("Cannot get server version: ${error.toString()}", error, stack);
    }
    return null;
  }

  Future<ServerFeatures?> getServerFeatures() async {
    try {
      final dto = await _apiService.serverInfoApi.getServerFeatures();
      if (dto != null) {
        return ServerFeatures.fromDto(dto);
      }
    } catch (error, stack) {
      _log.severe("Cannot get server features: ${error.toString()}", error, stack);
    }
    return null;
  }

  Future<ServerConfig?> getServerConfig() async {
    try {
      final dto = await _apiService.serverInfoApi.getServerConfig();
      if (dto != null) {
        return ServerConfig.fromDto(dto);
      }
    } catch (error, stack) {
      _log.severe("Cannot get server config: ${error.toString()}", error, stack);
    }
    return null;
  }
}
