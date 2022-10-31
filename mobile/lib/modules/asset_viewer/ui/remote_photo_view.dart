import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:photo_view/photo_view.dart';

enum _RemoteImageStatus { empty, thumbnail, preview, full }

class _RemotePhotoViewState extends State<RemotePhotoView> {
  late ImageProvider _imageProvider;
  _RemoteImageStatus _status = _RemoteImageStatus.empty;
  bool _zoomedIn = false;

  late CachedNetworkImageProvider _fullProvider;
  late CachedNetworkImageProvider _previewProvider;
  late CachedNetworkImageProvider _thumbnailProvider;
  late AssetEntityImageProvider _localProvider;

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
    if (widget.asset.isLocal) {
      _localProvider = AssetEntityImageProvider(widget.asset.local!);
      _imageProvider = _localProvider;
      return;
    }

    _thumbnailProvider = _authorizedImageProvider(
      widget.thumbnailUrl!,
      widget.cacheKey,
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

    if (widget.previewUrl != null) {
      _previewProvider = _authorizedImageProvider(
        widget.previewUrl!,
        "${widget.cacheKey}_previewStage",
      );
      _previewProvider.resolve(const ImageConfiguration()).addListener(
        ImageStreamListener((ImageInfo imageInfo, _) {
          _performStateTransition(_RemoteImageStatus.preview, _previewProvider);
        }),
      );
    }

    _fullProvider = _authorizedImageProvider(
      widget.imageUrl!,
      "${widget.cacheKey}_fullStage",
    );
    _fullProvider.resolve(const ImageConfiguration()).addListener(
      ImageStreamListener((ImageInfo imageInfo, _) {
        _performStateTransition(_RemoteImageStatus.full, _fullProvider);
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

  final Asset asset;
  final String? thumbnailUrl;
  final String? imageUrl;
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
