import 'package:immich_mobile/domain/models/server-info/server_config.model.dart';
import 'package:immich_mobile/domain/models/server-info/server_features.model.dart';

class ServerFeatureConfig {
  final ServerFeatures features;
  final ServerConfig config;

  const ServerFeatureConfig({required this.features, required this.config});

  ServerFeatureConfig copyWith({
    ServerFeatures? features,
    ServerConfig? config,
  }) {
    return ServerFeatureConfig(
      features: features ?? this.features,
      config: config ?? this.config,
    );
  }

  const ServerFeatureConfig.reset()
      : features = const ServerFeatures.reset(),
        config = const ServerConfig.reset();

  @override
  String toString() =>
      'ServerFeatureConfig(features: $features, config: $config)';

  @override
  bool operator ==(covariant ServerFeatureConfig other) {
    if (identical(this, other)) return true;

    return other.features == features && other.config == config;
  }

  @override
  int get hashCode => features.hashCode ^ config.hashCode;
}
