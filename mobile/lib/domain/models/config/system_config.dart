import 'package:immich_mobile/domain/models/log.model.dart';

class SystemConfig {
  final LogLevel logLevel;

  const SystemConfig({this.logLevel = .info});

  SystemConfig copyWith({LogLevel? logLevel}) => SystemConfig(logLevel: logLevel ?? this.logLevel);

  @override
  bool operator ==(Object other) => identical(this, other) || (other is SystemConfig && other.logLevel == logLevel);

  @override
  int get hashCode => logLevel.hashCode;

  @override
  String toString() => 'SystemConfig(logLevel: $logLevel)';
}
