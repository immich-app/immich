import 'package:immich_mobile/domain/interfaces/api/server_api.interface.dart';
import 'package:immich_mobile/domain/models/server-info/server_config.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_disk_info.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_features.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_version.model.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:openapi/api.dart' as api;

class ServerApiRepository with LogMixin implements IServerApiRepository {
  final api.ServerApi _serverApi;

  const ServerApiRepository({required api.ServerApi serverApi})
      : _serverApi = serverApi;

  @override
  Future<void> pingServer() async {
    await _serverApi.pingServer();
  }

  @override
  Future<ServerConfig?> getServerConfig() async {
    try {
      final config = await _serverApi.getServerConfig();
      if (config != null) {
        return _fromConfigDto(config);
      }
    } catch (e, s) {
      log.e("Exception occured while fetching server config", e, s);
    }
    return null;
  }

  @override
  Future<ServerFeatures?> getServerFeatures() async {
    try {
      final features = await _serverApi.getServerFeatures();
      if (features != null) {
        return _fromFeatureDto(features);
      }
    } catch (e, s) {
      log.e("Exception occured while fetching server features", e, s);
    }
    return null;
  }

  @override
  Future<ServerDiskInfo?> getServerDiskInfo() async {
    try {
      final storage = await _serverApi.getStorage();
      if (storage != null) {
        return _fromStorageDto(storage);
      }
    } catch (e, s) {
      log.e("Exception occured while fetching server disk info", e, s);
    }
    return null;
  }

  @override
  Future<ServerVersion?> getServerVersion() async {
    try {
      final version = await _serverApi.getServerVersion();
      if (version != null) {
        return _fromVersionDto(version);
      }
    } catch (e, s) {
      log.e("Exception occured while fetching server version", e, s);
    }
    return null;
  }
}

ServerConfig _fromConfigDto(api.ServerConfigDto dto) => ServerConfig(
      oauthButtonText: dto.oauthButtonText.isEmpty ? null : dto.oauthButtonText,
    );

ServerFeatures _fromFeatureDto(api.ServerFeaturesDto dto) => ServerFeatures(
      hasPasswordLogin: dto.passwordLogin,
      hasOAuthLogin: dto.oauth,
    );

ServerDiskInfo _fromStorageDto(api.ServerStorageResponseDto dto) =>
    ServerDiskInfo(
      diskAvailableInBytes: dto.diskAvailableRaw,
      diskSizeInBytes: dto.diskSizeRaw,
      diskUseInBytes: dto.diskUseRaw,
      diskUsagePercentage: dto.diskUsagePercentage,
    );

ServerVersion _fromVersionDto(api.ServerVersionResponseDto dto) =>
    ServerVersion(major: dto.major, minor: dto.minor, patch: dto.patch_);
