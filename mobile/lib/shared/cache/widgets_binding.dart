import 'package:flutter/widgets.dart';

import 'custom_image_cache.dart';

final class ImmichWidgetsBinding extends WidgetsFlutterBinding {
  @override
  ImageCache createImageCache() => CustomImageCache();
}
