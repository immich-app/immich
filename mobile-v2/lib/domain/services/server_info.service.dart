import 'package:immich_mobile/domain/models/server-info/server_config.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_features.model.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';
import 'package:openapi/openapi.dart';

class ServerInfoService with LogContext {
  final Openapi _api;

  ServerApi get _serverInfo => _api.getServerApi();

  ServerInfoService(this._api);

  Future<ServerFeatures?> getServerFeatures() async {
    try {
      final response = await _serverInfo.getServerFeatures();
      final dto = response.data;
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
      final response = await _serverInfo.getServerConfig();
      final dto = response.data;
      if (dto != null) {
        return ServerConfig.fromDto(dto);
      }
    } catch (e, s) {
      log.severe("Error while fetching server config", e, s);
    }
    return null;
  }
}
