import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:photo_view/photo_view.dart';

enum _RemoteImageStatus {
  empty,
  thumbnail,
  full
}

class _RemotePhotoViewState extends State<RemotePhotoView> {
  late CachedNetworkImageProvider _imageProvider;
  _RemoteImageStatus _status = _RemoteImageStatus.empty;

  @override
  Widget build(BuildContext context) {
    bool allowMoving = _status == _RemoteImageStatus.full;

    return PhotoView(
        imageProvider: _imageProvider,
        minScale: PhotoViewComputedScale.contained,
        maxScale: allowMoving ? null : PhotoViewComputedScale.contained,
    );
  }

  CachedNetworkImageProvider _authorizedImageProvider(String url) {
    return CachedNetworkImageProvider(
        url,
        headers: { "Authorization": widget.authToken },
        cacheKey: url
    );
  }

  void _performStateTransition(_RemoteImageStatus newStatus, CachedNetworkImageProvider provider) {
    // Transition to same status is forbidden
    if (_status == newStatus) return;
    // Transition full -> thumbnail is forbidden
    if (_status == _RemoteImageStatus.full && newStatus == _RemoteImageStatus.thumbnail) return;

    if (!mounted) return;

    setState(() {
      _status = newStatus;
      _imageProvider = provider;
    });
  }

  void _loadImages() {
    CachedNetworkImageProvider thumbnailProvider = _authorizedImageProvider(widget.thumbnailUrl);
    _imageProvider = thumbnailProvider;

    thumbnailProvider.resolve(const ImageConfiguration()).addListener(ImageStreamListener((ImageInfo imageInfo, _) {
      _performStateTransition(_RemoteImageStatus.thumbnail, thumbnailProvider);
    }));

    CachedNetworkImageProvider fullProvider = _authorizedImageProvider(widget.imageUrl);
    fullProvider.resolve(const ImageConfiguration()).addListener(ImageStreamListener((ImageInfo imageInfo, _) {
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
  const RemotePhotoView({ Key? key, required this.thumbnailUrl, required this.imageUrl, required this.authToken }) : super(key: key);

  final String thumbnailUrl;
  final String imageUrl;
  final String authToken;

  @override
  State<StatefulWidget> createState() {
    return _RemotePhotoViewState();
  }
}