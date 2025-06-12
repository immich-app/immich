import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';

class ThumbnailTile extends StatelessWidget {
  const ThumbnailTile({
    required this.asset,
    this.size = const Size.square(256),
    this.fit = BoxFit.cover,
    super.key,
  });

  final BaseAsset asset;
  final Size size;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: DecoratedBox(
            decoration: const BoxDecoration(color: Colors.black12),
            child: Thumbnail(asset: asset, fit: fit, size: size),
          ),
        ),
        if (asset.isVideo)
          const Align(
            alignment: Alignment.topRight,
            child: Padding(
              padding: EdgeInsets.only(right: 10.0, top: 6.0),
              child: _VideoIndicator(),
            ),
          ),
        Align(
          alignment: Alignment.bottomRight,
          child: Padding(
            padding: const EdgeInsets.only(right: 10.0, bottom: 6.0),
            child: _StorageIndicator(storage: asset.storage),
          ),
        ),
        if (asset.isFavorite)
          const Align(
            alignment: Alignment.bottomLeft,
            child: Padding(
              padding: EdgeInsets.only(left: 10.0, bottom: 6.0),
              child: _FavoriteIndicator(),
            ),
          ),
      ],
    );
  }
}

class _VideoIndicator extends StatelessWidget {
  const _VideoIndicator();

  @override
  Widget build(BuildContext context) {
    return const _TileOverlayIcon(Icons.play_circle_filled_rounded);
  }
}

class _FavoriteIndicator extends StatelessWidget {
  const _FavoriteIndicator();

  @override
  Widget build(BuildContext context) {
    return const _TileOverlayIcon(Icons.favorite_rounded);
  }
}

class _StorageIndicator extends StatelessWidget {
  final AssetState storage;

  const _StorageIndicator({required this.storage});

  @override
  Widget build(BuildContext context) {
    return _TileOverlayIcon(
      switch (storage) {
        AssetState.local => Icons.cloud_off_outlined,
        AssetState.remote => Icons.cloud_outlined,
        AssetState.merged => Icons.cloud_done_outlined,
      },
    );
  }
}

class _TileOverlayIcon extends StatelessWidget {
  final IconData icon;

  const _TileOverlayIcon(this.icon);

  @override
  Widget build(BuildContext context) {
    return Icon(
      icon,
      color: Colors.white.withValues(alpha: .8),
      size: 20,
      shadows: [
        Shadow(
          blurRadius: 5.0,
          color: Colors.black.withValues(alpha: 0.6),
        ),
      ],
    );
  }
}
