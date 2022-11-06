import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';

enum _RemoteImageStatus { empty, thumbnail, preview, full }

class _RemotePhotoViewState extends State<RemotePhotoView> {
  late CachedNetworkImageProvider _imageProvider;
  _RemoteImageStatus _status = _RemoteImageStatus.empty;
  bool _zoomedIn = false;

  late CachedNetworkImageProvider fullProvider;
  late CachedNetworkImageProvider previewProvider;
  late CachedNetworkImageProvider thumbnailProvider;

  @override
  Widget build(BuildContext context) {
    bool allowMoving = _status == _RemoteImageStatus.full;

    return IgnorePointer(
      ignoring: !allowMoving,
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
    int sensitivity = 10;

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
    CachedNetworkImageProvider provider,
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
    thumbnailProvider = _authorizedImageProvider(
      widget.thumbnailUrl,
      widget.cacheKey,
    );
    _imageProvider = thumbnailProvider;

    thumbnailProvider.resolve(const ImageConfiguration()).addListener(
      ImageStreamListener((ImageInfo imageInfo, _) {
        _performStateTransition(
          _RemoteImageStatus.thumbnail,
          thumbnailProvider,
        );
      }),
    );

    if (widget.previewUrl != null) {
      previewProvider = _authorizedImageProvider(
        widget.previewUrl!,
        "${widget.cacheKey}_previewStage",
      );
      previewProvider.resolve(const ImageConfiguration()).addListener(
        ImageStreamListener((ImageInfo imageInfo, _) {
          _performStateTransition(_RemoteImageStatus.preview, previewProvider);
        }),
      );
    }

    fullProvider = _authorizedImageProvider(
      widget.imageUrl,
      "${widget.cacheKey}_fullStage",
    );
    fullProvider.resolve(const ImageConfiguration()).addListener(
      ImageStreamListener((ImageInfo imageInfo, _) {
        _performStateTransition(_RemoteImageStatus.full, fullProvider);
      }),
    );
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
      await fullProvider.evict();
    } else if (_status == _RemoteImageStatus.preview) {
      await previewProvider.evict();
    } else if (_status == _RemoteImageStatus.thumbnail) {
      await thumbnailProvider.evict();
    }

    await _imageProvider.evict();
  }
}

class RemotePhotoView extends StatefulWidget {
  const RemotePhotoView({
    Key? key,
    required this.thumbnailUrl,
    required this.imageUrl,
    required this.authToken,
    required this.isZoomedFunction,
    required this.isZoomedListener,
    required this.onSwipeDown,
    required this.onSwipeUp,
    this.previewUrl,
    required this.cacheKey,
  }) : super(key: key);

  final String thumbnailUrl;
  final String imageUrl;
  final String authToken;
  final String? previewUrl;
  final String cacheKey;

  final void Function() onSwipeDown;
  final void Function() onSwipeUp;
  final void Function() isZoomedFunction;

  final ValueNotifier<bool> isZoomedListener;

  @override
  State<StatefulWidget> createState() {
    return _RemotePhotoViewState();
  }
}
