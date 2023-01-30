import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart'
    show AssetEntityImageProvider, ThumbnailSize;

enum _RemoteImageStatus { empty, thumbnail, preview, full }

/// The Remote Photo View downloads and displays a remote Photo
/// with the optional callback of playing a "onImageLoaded" on 
/// completion
class RemotePhotoView extends StatefulWidget {
  const RemotePhotoView({
    Key? key,
    required this.asset,
    required this.authToken,
    required this.loadPreview,
    required this.loadOriginal,
    this.onImageLoaded,
  }) : super(key: key);

  final Asset asset;
  final String authToken;
  final bool loadPreview;
  final bool loadOriginal;

  /// Called when the image is ready to allow zoom and is no longer a 
  /// thumbnail
  final void Function()? onImageLoaded;

  @override
  State<StatefulWidget> createState() {
    return _RemotePhotoViewState();
  }
}

class _RemotePhotoViewState extends State<RemotePhotoView> {
  late ImageProvider _imageProvider;
  _RemoteImageStatus _status = _RemoteImageStatus.empty;

  late ImageProvider _fullProvider;
  late ImageProvider _previewProvider;
  late ImageProvider _thumbnailProvider;

  @override
  Widget build(BuildContext context) {
    return Image(
      gaplessPlayback: true,
      image: _imageProvider,
    );
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

    /// Image is loaded
    if (_status == _RemoteImageStatus.empty &&
      newStatus != _RemoteImageStatus.thumbnail) {
      widget.onImageLoaded?.call();
    }

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

