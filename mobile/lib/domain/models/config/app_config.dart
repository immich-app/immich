import 'package:immich_mobile/domain/models/config/cleanup_config.dart';
import 'package:immich_mobile/domain/models/config/theme_config.dart';

class AppConfig {
  final ThemeConfig theme;
  final CleanupConfig cleanup;

  const AppConfig({this.theme = const .new(), this.cleanup = const .new()});

  AppConfig copyWith({ThemeConfig? theme, CleanupConfig? cleanup}) =>
      .new(theme: theme ?? this.theme, cleanup: cleanup ?? this.cleanup);

  @override
  bool operator ==(Object other) =>
      identical(this, other) || (other is AppConfig && other.theme == theme && other.cleanup == cleanup);

  @override
  int get hashCode => Object.hash(theme, cleanup);

  @override
  String toString() => 'AppConfig(theme: $theme, cleanup: $cleanup)';
}
