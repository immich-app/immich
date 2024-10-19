import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/api/server_api.interface.dart';
import 'package:immich_mobile/domain/models/server-info/server_feature_config.model.dart';

class ServerFeatureConfigProvider extends ValueNotifier<ServerFeatureConfig> {
  final IServerApiRepository _serverApiRepository;

  ServerFeatureConfigProvider({required IServerApiRepository serverApiRepo})
      : _serverApiRepository = serverApiRepo,
        super(const ServerFeatureConfig.initial());

  Future<void> getFeatures() async =>
      await Future.wait([_getFeatures(), _getConfig()]);

  Future<void> _getFeatures() async {
    final features = await _serverApiRepository.getServerFeatures();
    if (features != null) {
      value = value.copyWith(features: features);
    }
  }

  Future<void> _getConfig() async {
    final config = await _serverApiRepository.getServerConfig();
    if (config != null) {
      value = value.copyWith(config: config);
    }
  }
}
