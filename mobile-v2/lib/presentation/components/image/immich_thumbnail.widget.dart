import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset.model.dart';
import 'package:immich_mobile/presentation/components/image/immich_image.widget.dart';
import 'package:immich_mobile/utils/constants/size_constants.dart';
import 'package:material_symbols_icons/symbols.dart';

IconData _getStorageIcon(Asset asset) {
  if (asset.isMerged) {
    return Symbols.cloud_done_rounded;
  } else if (asset.isRemote) {
    return Symbols.cloud_rounded;
  }
  return Symbols.cloud_off_rounded;
}

class ImThumbnail extends StatelessWidget {
  final Asset asset;
  final double? width;
  final double? height;

  const ImThumbnail(this.asset, {this.width, this.height, super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(child: ImImage(asset, width: width, height: height)),
        _PadAlignedIcon(
          alignment: Alignment.bottomRight,
          icon: _getStorageIcon(asset),
        ),
        if (!asset.isImage)
          const _PadAlignedIcon(
            alignment: Alignment.topLeft,
            icon: Symbols.play_circle_rounded,
            filled: true,
          ),
      ],
    );
  }
}

class _PadAlignedIcon extends StatelessWidget {
  final Alignment alignment;
  final IconData icon;
  final bool? filled;

  const _PadAlignedIcon({
    required this.alignment,
    required this.icon,
    this.filled,
  });

  double _calculateLeft(Alignment align) {
    return align.x == -1 ? 5 : 0;
  }

  double _calculateTop(Alignment align) {
    return align.y == -1 ? 4 : 0;
  }

  double _calculateRight(Alignment align) {
    return align.x == 1 ? 5 : 0;
  }

  double _calculateBottom(Alignment align) {
    return align.y == 1 ? 4 : 0;
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: _calculateLeft(alignment),
      top: _calculateTop(alignment),
      right: _calculateRight(alignment),
      bottom: _calculateBottom(alignment),
      child: Align(
        alignment: alignment,
        child: Icon(
          icon,
          size: SizeConstants.xm,
          fill: (filled != null && filled!) ? 1 : null,
          color: Colors.white,
        ),
      ),
    );
  }
}
