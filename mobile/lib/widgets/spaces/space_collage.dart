import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:openapi/api.dart';

/// Returns the gradient colors for a given space color enum value.
/// Used by both SpaceCollage and SpaceCard.
List<Color> spaceGradientColors(SharedSpaceResponseDtoColorEnum? color) {
  return switch (color) {
    SharedSpaceResponseDtoColorEnum.primary => [const Color(0xFF6366F1), const Color(0xFF4338CA)],
    SharedSpaceResponseDtoColorEnum.pink => [const Color(0xFFF9A8D4), const Color(0xFFEC4899)],
    SharedSpaceResponseDtoColorEnum.red => [const Color(0xFFF87171), const Color(0xFFDC2626)],
    SharedSpaceResponseDtoColorEnum.yellow => [const Color(0xFFFDE047), const Color(0xFFEAB308)],
    SharedSpaceResponseDtoColorEnum.blue => [const Color(0xFF60A5FA), const Color(0xFF2563EB)],
    SharedSpaceResponseDtoColorEnum.green => [const Color(0xFF4ADE80), const Color(0xFF15803D)],
    SharedSpaceResponseDtoColorEnum.purple => [const Color(0xFFC084FC), const Color(0xFF7E22CE)],
    SharedSpaceResponseDtoColorEnum.orange => [const Color(0xFFFB923C), const Color(0xFFEA580C)],
    SharedSpaceResponseDtoColorEnum.gray => [const Color(0xFF9CA3AF), const Color(0xFF4B5563)],
    SharedSpaceResponseDtoColorEnum.amber => [const Color(0xFFFBBF24), const Color(0xFFD97706)],
    _ => [const Color(0xFF6366F1), const Color(0xFF4338CA)],
  };
}

class SpaceCollage extends StatelessWidget {
  final List<String> recentAssetIds;
  final List<String> recentAssetThumbhashes;
  final SharedSpaceResponseDtoColorEnum? color;
  final double size;

  const SpaceCollage({
    super.key,
    required this.recentAssetIds,
    required this.recentAssetThumbhashes,
    this.color,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(width: size, height: size, child: _buildLayout()),
    );
  }

  Widget _buildLayout() {
    final count = recentAssetIds.length;
    if (count == 0) {
      return _buildEmpty();
    } else if (count == 1) {
      return _buildSingle();
    } else if (count <= 3) {
      return _buildAsymmetric();
    } else {
      return _buildGrid();
    }
  }

  /// 0 assets: gradient background with a centered icon
  Widget _buildEmpty() {
    final colors = spaceGradientColors(color);
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: colors),
      ),
      child: Center(
        child: Icon(Icons.photo_library_outlined, color: Colors.white.withValues(alpha: 0.7), size: size * 0.35),
      ),
    );
  }

  /// 1 asset: single image filling the square
  Widget _buildSingle() {
    return _buildImage(0);
  }

  /// 2-3 assets: left 60% (one tall image), right 40% (1-2 stacked), 2px gap
  Widget _buildAsymmetric() {
    final count = recentAssetIds.length;
    return Row(
      children: [
        SizedBox(width: (size - 2) * 0.6, height: size, child: _buildImage(0)),
        const SizedBox(width: 2),
        Expanded(
          child: Column(
            children: [
              Expanded(child: _buildImage(1)),
              if (count >= 3) ...[const SizedBox(height: 2), Expanded(child: _buildImage(2))],
            ],
          ),
        ),
      ],
    );
  }

  /// 4+ assets: 2x2 grid with 2px gaps
  Widget _buildGrid() {
    return Column(
      children: [
        Expanded(
          child: Row(
            children: [
              Expanded(child: _buildImage(0)),
              const SizedBox(width: 2),
              Expanded(child: _buildImage(1)),
            ],
          ),
        ),
        const SizedBox(height: 2),
        Expanded(
          child: Row(
            children: [
              Expanded(child: _buildImage(2)),
              const SizedBox(width: 2),
              Expanded(child: _buildImage(3)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildImage(int index) {
    final assetId = recentAssetIds[index];
    final thumbhash = index < recentAssetThumbhashes.length ? recentAssetThumbhashes[index] : '';
    final colors = spaceGradientColors(color);

    return Image(
      image: RemoteImageProvider.thumbnail(assetId: assetId, thumbhash: thumbhash),
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      errorBuilder: (context, error, stackTrace) {
        return Container(color: colors[0].withValues(alpha: 0.3));
      },
    );
  }
}
