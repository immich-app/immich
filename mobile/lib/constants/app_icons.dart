/// The selectable launcher icons. The [name] of each variant is the id shared
/// with the native implementations (Android activity-aliases and iOS
/// alternate icon asset names), so renaming a value is a breaking change.
enum AppIconVariant {
  classic,
  midnight,
  ocean,
  sunset,
  forest,
  blossom,
  ink,
  neon,
  gold;

  String get assetPath => 'assets/app-icons/app-icon-$name.svg';

  String get translationKey => 'app_icon_$name';

  static AppIconVariant fromId(String id) =>
      AppIconVariant.values.firstWhere((variant) => variant.name == id, orElse: () => AppIconVariant.classic);
}
