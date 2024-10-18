import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/server-info/server_feature_config.model.dart';
import 'package:immich_mobile/domain/services/server_info.service.dart';

class ServerFeatureConfigProvider extends ValueNotifier<ServerFeatureConfig> {
  final ServerInfoService _serverInfoService;

  ServerFeatureConfigProvider(this._serverInfoService)
      : super(const ServerFeatureConfig.reset());

  Future<void> getFeatures() async =>
      await Future.wait([_getFeatures(), _getConfig()]);

  Future<void> _getFeatures() async {
    final features = await _serverInfoService.getServerFeatures();
    if (features != null) {
      value = value.copyWith(features: features);
    }
  }

  Future<void> _getConfig() async {
    final config = await _serverInfoService.getServerConfig();
    if (config != null) {
      value = value.copyWith(config: config);
    }
  }
}
