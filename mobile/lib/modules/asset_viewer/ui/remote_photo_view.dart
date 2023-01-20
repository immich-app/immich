import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart'
    show AssetEntityImageProvider, ThumbnailSize;
import 'package:photo_view/photo_view.dart';

enum _RemoteImageStatus { empty, thumbnail, preview, full }

class _RemotePhotoViewState extends State<RemotePhotoView> {
  late ImageProvider _imageProvider;
  _RemoteImageStatus _status = _RemoteImageStatus.empty;
  bool _zoomedIn = false;

  late ImageProvider _fullProvider;
  late ImageProvider _previewProvider;
  late ImageProvider _thumbnailProvider;

  @override
  Widget build(BuildContext context) {
    final bool forbidZoom = _status == _RemoteImageStatus.thumbnail;

    return IgnorePointer(
      ignoring: forbidZoom,
      child: Listener(
        onPointerMove: handleSwipUpDown,
        child: PhotoView(
          imageProvider: _imageProvider,
          minScale: PhotoViewComputedScale.contained,
          enablePanAlways: false,
          scaleStateChangedCallback: _scaleStateChanged,
        ),
      ),
    );
  }

  void handleSwipUpDown(PointerMoveEvent details) {
    int sensitivity = 15;

    if (_zoomedIn) {
      return;
    }

    if (details.delta.dy > sensitivity) {
      widget.onSwipeDown();
    } else if (details.delta.dy < -sensitivity) {
      widget.onSwipeUp();
    }
  }

  void _scaleStateChanged(PhotoViewScaleState state) {
    _zoomedIn = state != PhotoViewScaleState.initial;
    if (_zoomedIn) {
      widget.isZoomedListener.value = true;
    } else {
      widget.isZoomedListener.value = false;
    }
    widget.isZoomedFunction();
  }

  CachedNetworkImageProvider _authorizedImageProvider(
    String url,
    String cacheKey,
  ) {
    return CachedNetworkImageProvider(
      url,
      headers: {"Authorization": widget.authToken},
      cacheKey: cacheKey,
    );
  }

  void _performStateTransition(
    _RemoteImageStatus newStatus,
    ImageProvider provider,
  ) {
    if (_status == newStatus) return;

    if (_status == _RemoteImageStatus.full &&
        newStatus == _RemoteImageStatus.thumbnail) return;

    if (_status == _RemoteImageStatus.preview &&
        newStatus == _RemoteImageStatus.thumbnail) return;

    if (_status == _RemoteImageStatus.full &&
        newStatus == _RemoteImageStatus.preview) return;

    if (!mounted) return;

    setState(() {
      _status = newStatus;
      _imageProvider = provider;
    });
  }

  void _loadImages() {
    if (widget.asset.isLocal) {
      _imageProvider = AssetEntityImageProvider(
        widget.asset.local!,
        isOriginal: false,
        thumbnailSize: const ThumbnailSize.square(250),
      );
      _fullProvider = AssetEntityImageProvider(widget.asset.local!);
      _fullProvider.resolve(const ImageConfiguration()).addListener(
        ImageStreamListener((ImageInfo image, _) {
          _performStateTransition(
            _RemoteImageStatus.full,
            _fullProvider,
          );
        }),
      );
      return;
    }

    _thumbnailProvider = _authorizedImageProvider(
      getThumbnailUrl(widget.asset.remote!),
      getThumbnailCacheKey(widget.asset.remote!),
    );
    _imageProvider = _thumbnailProvider;

    _thumbnailProvider.resolve(const ImageConfiguration()).addListener(
      ImageStreamListener((ImageInfo imageInfo, _) {
        _performStateTransition(
          _RemoteImageStatus.thumbnail,
          _thumbnailProvider,
        );
      }),
    );

    if (widget.loadPreview) {
      _previewProvider = _authorizedImageProvider(
        getThumbnailUrl(widget.asset.remote!, type: ThumbnailFormat.JPEG),
        getThumbnailCacheKey(widget.asset.remote!, type: ThumbnailFormat.JPEG),
      );
      _previewProvider.resolve(const ImageConfiguration()).addListener(
        ImageStreamListener((ImageInfo imageInfo, _) {
          _performStateTransition(_RemoteImageStatus.preview, _previewProvider);
        }),
      );
    }

    if (widget.loadOriginal) {
      _fullProvider = _authorizedImageProvider(
        getImageUrl(widget.asset.remote!),
        getImageCacheKey(widget.asset.remote!),
      );
      _fullProvider.resolve(const ImageConfiguration()).addListener(
        ImageStreamListener((ImageInfo imageInfo, _) {
          _performStateTransition(_RemoteImageStatus.full, _fullProvider);
        }),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    _loadImages();
  }

  @override
  void dispose() async {
    super.dispose();

    if (_status == _RemoteImageStatus.full) {
      await _fullProvider.evict();
    } else if (_status == _RemoteImageStatus.preview) {
      await _previewProvider.evict();
    } else if (_status == _RemoteImageStatus.thumbnail) {
      await _thumbnailProvider.evict();
    }

    await _imageProvider.evict();
  }
}

class RemotePhotoView extends StatefulWidget {
  const RemotePhotoView({
    Key? key,
    required this.asset,
    required this.authToken,
    required this.loadPreview,
    required this.loadOriginal,
    required this.isZoomedFunction,
    required this.isZoomedListener,
    required this.onSwipeDown,
    required this.onSwipeUp,
  }) : super(key: key);

  final Asset asset;
  final String authToken;
  final bool loadPreview;
  final bool loadOriginal;
  final void Function() onSwipeDown;
  final void Function() onSwipeUp;
  final void Function() isZoomedFunction;

  final ValueNotifier<bool> isZoomedListener;

  @override
  State<StatefulWidget> createState() {
    return _RemotePhotoViewState();
  }
}
