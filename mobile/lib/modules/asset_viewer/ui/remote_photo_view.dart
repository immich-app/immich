import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:photo_view/photo_view.dart';

enum _RemoteImageStatus { empty, thumbnail, full }

class _RemotePhotoViewState extends State<RemotePhotoView> {
  late CachedNetworkImageProvider _imageProvider;
  _RemoteImageStatus _status = _RemoteImageStatus.empty;
  bool _zoomedIn = false;

  static const int swipeThreshold = 100;

  @override
  Widget build(BuildContext context) {
    bool allowMoving = _status == _RemoteImageStatus.full;

    return PhotoView(
        imageProvider: _imageProvider,
        minScale: PhotoViewComputedScale.contained,
        maxScale: allowMoving ? 1.0 : PhotoViewComputedScale.contained,
        enablePanAlways: true,
        scaleStateChangedCallback: _scaleStateChanged,
        onScaleEnd: _onScaleListener);
  }

  void _onScaleListener(BuildContext context, ScaleEndDetails details,
      PhotoViewControllerValue controllerValue) {
    // Disable swipe events when zoomed in
    if (_zoomedIn) return;

    if (controllerValue.position.dy > swipeThreshold) {
      widget.onSwipeDown();
    } else if (controllerValue.position.dy < -swipeThreshold) {
      widget.onSwipeUp();
    }
  }

  void _scaleStateChanged(PhotoViewScaleState state) {
    _zoomedIn = state == PhotoViewScaleState.zoomedIn;
  }

  CachedNetworkImageProvider _authorizedImageProvider(String url) {
    return CachedNetworkImageProvider(url,
        headers: {"Authorization": widget.authToken}, cacheKey: url);
  }

  void _performStateTransition(
      _RemoteImageStatus newStatus, CachedNetworkImageProvider provider) {
    // Transition to same status is forbidden
    if (_status == newStatus) return;
    // Transition full -> thumbnail is forbidden
    if (_status == _RemoteImageStatus.full &&
        newStatus == _RemoteImageStatus.thumbnail) return;

    if (!mounted) return;

    setState(() {
      _status = newStatus;
      _imageProvider = provider;
    });
  }

  void _loadImages() {
    CachedNetworkImageProvider thumbnailProvider =
        _authorizedImageProvider(widget.thumbnailUrl);
    _imageProvider = thumbnailProvider;

    thumbnailProvider
        .resolve(const ImageConfiguration())
        .addListener(ImageStreamListener((ImageInfo imageInfo, _) {
      _performStateTransition(_RemoteImageStatus.thumbnail, thumbnailProvider);
    }));

    CachedNetworkImageProvider fullProvider =
        _authorizedImageProvider(widget.imageUrl);
    fullProvider
        .resolve(const ImageConfiguration())
        .addListener(ImageStreamListener((ImageInfo imageInfo, _) {
      _performStateTransition(_RemoteImageStatus.full, fullProvider);
    }));
  }

  @override
  void initState() {
    _loadImages();
    super.initState();
  }
}

class RemotePhotoView extends StatefulWidget {
  const RemotePhotoView(
      {Key? key,
      required this.thumbnailUrl,
      required this.imageUrl,
      required this.authToken,
      required this.onSwipeDown,
      required this.onSwipeUp})
      : super(key: key);

  final String thumbnailUrl;
  final String imageUrl;
  final String authToken;

  final void Function() onSwipeDown;
  final void Function() onSwipeUp;

  @override
  State<StatefulWidget> createState() {
    return _RemotePhotoViewState();
  }
}
