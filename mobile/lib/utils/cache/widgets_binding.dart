import 'package:flutter/widgets.dart';
import 'package:immich_mobile/utils/cache/custom_image_cache.dart';

final class ImmichWidgetsBinding extends WidgetsFlutterBinding {
  @override
  ImageCache createImageCache() => CustomImageCache();
}
