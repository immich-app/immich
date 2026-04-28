import 'package:immich_mobile/domain/models/config/log_config.dart';

class SystemConfig {
  final LogConfig log;

  const SystemConfig({this.log = const .new()});

  SystemConfig copyWith({LogConfig? log}) => .new(log: log ?? this.log);

  @override
  bool operator ==(Object other) => identical(this, other) || (other is SystemConfig && other.log == log);

  @override
  int get hashCode => log.hashCode;

  @override
  String toString() => 'SystemConfig(log: $log)';
}
