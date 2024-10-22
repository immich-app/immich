import 'package:cached_network_image/cached_network_image.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/immich_api_client.dart';

class ImCachedNetworkImage extends CachedNetworkImage {
  ImCachedNetworkImage({
    super.key,
    required super.imageUrl,
    super.cacheKey,
    super.height,
    super.width,
    super.fit,
    super.placeholder,
    super.fadeInDuration,
    super.errorWidget,
  }) : super(httpHeaders: di<ImApiClient>().headers);
}
