import 'package:immich_mobile/domain/models/log.model.dart';

class _Keys {
  const _Keys();

  final level = 'level';
}

class LogConfig {
  static const String name = 'log';

  // ignore: library_private_types_in_public_api
  static const _Keys keys = _Keys();

  final LogLevel level;

  const LogConfig({this.level = LogLevel.info});

  @override
  bool operator ==(Object other) => identical(this, other) || (other is LogConfig && other.level == level);

  @override
  int get hashCode => level.hashCode;

  @override
  String toString() => '$name: {${keys.level}: $level}';
}
