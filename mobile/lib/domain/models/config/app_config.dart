import 'package:immich_mobile/domain/models/config/cleanup_config.dart';
import 'package:immich_mobile/domain/models/config/map_config.dart';
import 'package:immich_mobile/domain/models/config/theme_config.dart';

class AppConfig {
  final ThemeConfig theme;
  final CleanupConfig cleanup;
  final MapConfig map;

  const AppConfig({this.theme = const .new(), this.cleanup = const .new(), this.map = const .new()});

  AppConfig copyWith({ThemeConfig? theme, CleanupConfig? cleanup, MapConfig? map}) =>
      .new(theme: theme ?? this.theme, cleanup: cleanup ?? this.cleanup, map: map ?? this.map);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AppConfig && other.theme == theme && other.cleanup == cleanup && other.map == map);

  @override
  int get hashCode => Object.hash(theme, cleanup, map);

  @override
  String toString() => 'AppConfig(theme: $theme, cleanup: $cleanup, map: $map)';
}
