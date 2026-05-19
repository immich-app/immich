import 'package:immich_mobile/domain/models/config/network_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';

class SystemConfig {
  final LogLevel logLevel;
  final NetworkConfig network;

  const SystemConfig({this.logLevel = .info, this.network = const .new()});

  SystemConfig copyWith({LogLevel? logLevel, NetworkConfig? network}) =>
      SystemConfig(logLevel: logLevel ?? this.logLevel, network: network ?? this.network);

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is SystemConfig && other.logLevel == logLevel && other.network == network);

  @override
  int get hashCode => Object.hash(logLevel, network);

  @override
  String toString() => 'SystemConfig(logLevel: $logLevel, network: $network)';
}
