import 'package:immich_mobile/domain/models/config/theme_config.dart';

class AppConfig {
  final ThemeConfig theme;

  const AppConfig({this.theme = const ThemeConfig()});

  AppConfig copyWith({ThemeConfig? theme}) => .new(theme: theme ?? this.theme);

  @override
  bool operator ==(Object other) => identical(this, other) || (other is AppConfig && other.theme == theme);

  @override
  int get hashCode => theme.hashCode;

  @override
  String toString() => 'AppConfig(theme: $theme)';
}
