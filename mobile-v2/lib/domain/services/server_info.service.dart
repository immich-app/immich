import 'package:immich_mobile/domain/models/server-info/server_config.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_features.model.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';
import 'package:openapi/api.dart';

class ServerInfoService with LogContext {
  final ServerApi _serverInfo;

  const ServerInfoService(this._serverInfo);

  Future<ServerFeatures?> getServerFeatures() async {
    try {
      final dto = await _serverInfo.getServerFeatures();
      if (dto != null) {
        return ServerFeatures.fromDto(dto);
      }
    } catch (e, s) {
      log.severe("Error while fetching server features", e, s);
    }
    return null;
  }

  Future<ServerConfig?> getServerConfig() async {
    try {
      final dto = await _serverInfo.getServerConfig();
      if (dto != null) {
        return ServerConfig.fromDto(dto);
      }
    } catch (e, s) {
      log.severe("Error while fetching server config", e, s);
    }
    return null;
  }
}
