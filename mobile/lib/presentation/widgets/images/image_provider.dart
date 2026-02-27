import 'package:async/async.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/infrastructure/loaders/image_request.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:logging/logging.dart';

abstract class CancellableImageProvider<T extends Object> extends ImageProvider<T> {
  void cancel();
}

mixin CancellableImageProviderMixin<T extends Object> on CancellableImageProvider<T> {
  static final _log = Logger('CancellableImageProviderMixin');

  bool isCancelled = false;
  ImageRequest? request;
  CancelableOperation<ImageInfo?>? cachedOperation;

  ImageInfo? getInitialImage(CancellableImageProvider provider) {
    final completer = CancelableCompleter<ImageInfo?>(onCancel: provider.cancel);
    final cachedStream = provider.resolve(const ImageConfiguration());
    ImageInfo? cachedImage;
    final listener = ImageStreamListener((image, synchronousCall) {
      if (synchronousCall) {
        cachedImage = image;
      }

      if (!completer.isCompleted) {
        completer.complete(image);
      }
    }, onError: completer.completeError);

    cachedStream.addListener(listener);
    if (cachedImage != null) {
      cachedStream.removeListener(listener);
      return cachedImage;
    }

    completer.operation.valueOrCancellation().whenComplete(() {
      cachedStream.removeListener(listener);
      cachedOperation = null;
    });
    cachedOperation = completer.operation;
    return null;
  }

  Stream<ImageInfo> loadRequest(ImageRequest request, ImageDecoderCallback decode, {bool evictOnError = true}) async* {
    if (isCancelled) {
      this.request = null;
      PaintingBinding.instance.imageCache.evict(this);
      return;
    }

    try {
      final image = await request.load(decode);
      if ((image == null && evictOnError) || isCancelled) {
        PaintingBinding.instance.imageCache.evict(this);
        return;
      } else if (image == null) {
        return;
      }
      yield image;
    } catch (e, stack) {
      if (evictOnError) {
        PaintingBinding.instance.imageCache.evict(this);
        rethrow;
      }
      _log.warning('Non-fatal image load error', e, stack);
    } finally {
      this.request = null;
    }
  }

  Stream<ImageInfo> initialImageStream() async* {
    final cachedOperation = this.cachedOperation;
    if (cachedOperation == null) {
      return;
    }

    try {
      final cachedImage = await cachedOperation.valueOrCancellation();
      if (cachedImage != null && !isCancelled) {
        yield cachedImage;
      }
    } catch (e, stack) {
      _log.severe('Error loading initial image', e, stack);
    } finally {
      this.cachedOperation = null;
    }
  }

  @override
  void cancel() {
    isCancelled = true;
    final request = this.request;
    if (request != null) {
      this.request = null;
      request.cancel();
    }

    final operation = cachedOperation;
    if (operation != null) {
      cachedOperation = null;
      operation.cancel();
    }
  }
}

ImageProvider getFullImageProvider(BaseAsset asset, {Size size = const Size(1080, 1920)}) {
  // Create new provider and cache it
  final ImageProvider provider;
  if (_shouldUseLocalAsset(asset)) {
    final id = asset is LocalAsset ? asset.id : (asset as RemoteAsset).localId!;
    provider = LocalFullImageProvider(id: id, size: size, assetType: asset.type);
  } else {
    final String assetId;
    final String thumbhash;
    if (asset is LocalAsset && asset.hasRemote) {
      assetId = asset.remoteId!;
      thumbhash = "";
    } else if (asset is RemoteAsset) {
      assetId = asset.id;
      thumbhash = asset.thumbHash ?? "";
    } else {
      throw ArgumentError("Unsupported asset type: ${asset.runtimeType}");
    }
    provider = RemoteFullImageProvider(assetId: assetId, thumbhash: thumbhash, assetType: asset.type);
  }

  return provider;
}

ImageProvider? getThumbnailImageProvider(BaseAsset asset, {Size size = kThumbnailResolution}) {
  if (_shouldUseLocalAsset(asset)) {
    final id = asset is LocalAsset ? asset.id : (asset as RemoteAsset).localId!;
    return LocalThumbProvider(id: id, size: size, assetType: asset.type);
  }

  final assetId = asset is RemoteAsset ? asset.id : (asset as LocalAsset).remoteId;
  final thumbhash = asset is RemoteAsset ? asset.thumbHash ?? "" : "";
  return assetId != null ? RemoteImageProvider.thumbnail(assetId: assetId, thumbhash: thumbhash) : null;
}

bool _shouldUseLocalAsset(BaseAsset asset) =>
    asset.hasLocal && (!asset.hasRemote || !AppSetting.get(Setting.preferRemoteImage)) && !asset.isEdited;
