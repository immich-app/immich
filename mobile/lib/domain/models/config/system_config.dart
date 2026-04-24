import 'package:immich_mobile/domain/models/config/log_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/models/metadata_value.dart';
import 'package:immich_mobile/extensions/json_extensions.dart';

class SystemConfig implements MetadataValue {
  static const String name = 'system-config';

  final LogConfig log;

  const SystemConfig({this.log = const LogConfig()});

  factory SystemConfig.fromJson(Map<String, Object?> json) {
    final logJson = json.nested(LogConfig.name);
    return SystemConfig(
      log: LogConfig(
        level: LogLevel.values.firstWhere((e) => e.name == logJson[LogConfig.keys.level], orElse: () => LogLevel.info),
      ),
    );
  }

  @override
  Map<String, Object?> toJson() => {
    LogConfig.name: {LogConfig.keys.level: log.level.name},
  };

  SystemConfig copyWith({LogLevel? logLevel}) => SystemConfig(log: LogConfig(level: logLevel ?? log.level));

  @override
  bool operator ==(Object other) => identical(this, other) || (other is SystemConfig && other.log == log);

  @override
  int get hashCode => log.hashCode;

  @override
  String toString() => '$name: { $log }';
}
