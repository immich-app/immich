import 'package:immich_mobile/domain/models/config/cleanup_config.dart';
import 'package:immich_mobile/domain/models/config/image_config.dart';
import 'package:immich_mobile/domain/models/config/map_config.dart';
import 'package:immich_mobile/domain/models/config/theme_config.dart';
import 'package:immich_mobile/domain/models/config/timeline_config.dart';
import 'package:immich_mobile/domain/models/config/viewer_config.dart';

class AppConfig {
  final ThemeConfig theme;
  final CleanupConfig cleanup;
  final MapConfig map;
  final TimelineConfig timeline;
  final ImageConfig image;
  final ViewerConfig viewer;

  const AppConfig({
    this.theme = const .new(),
    this.cleanup = const .new(),
    this.map = const .new(),
    this.timeline = const .new(),
    this.image = const .new(),
    this.viewer = const .new(),
  });

  AppConfig copyWith({
    ThemeConfig? theme,
    CleanupConfig? cleanup,
    MapConfig? map,
    TimelineConfig? timeline,
    ImageConfig? image,
    ViewerConfig? viewer,
  }) => .new(
    theme: theme ?? this.theme,
    cleanup: cleanup ?? this.cleanup,
    map: map ?? this.map,
    timeline: timeline ?? this.timeline,
    image: image ?? this.image,
    viewer: viewer ?? this.viewer,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AppConfig &&
          other.theme == theme &&
          other.cleanup == cleanup &&
          other.map == map &&
          other.timeline == timeline &&
          other.image == image &&
          other.viewer == viewer);

  @override
  int get hashCode => Object.hash(theme, cleanup, map, timeline, image, viewer);

  @override
  String toString() =>
      'AppConfig(theme: $theme, cleanup: $cleanup, map: $map, timeline: $timeline, image: $image, viewer: $viewer)';
}
