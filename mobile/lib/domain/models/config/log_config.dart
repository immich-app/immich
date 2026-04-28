import 'package:immich_mobile/domain/models/log.model.dart';

class LogConfig {
  final LogLevel level;

  const LogConfig({this.level = .info});

  LogConfig copyWith({LogLevel? level}) => .new(level: level ?? this.level);

  @override
  bool operator ==(Object other) => identical(this, other) || (other is LogConfig && other.level == level);

  @override
  int get hashCode => level.hashCode;

  @override
  String toString() => 'LogConfig(level: $level)';
}
