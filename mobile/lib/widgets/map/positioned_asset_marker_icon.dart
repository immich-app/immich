import 'dart:io';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/map/asset_marker_icon.dart';

class PositionedAssetMarkerIcon extends StatelessWidget {
  final Point<num> point;
  final String assetRemoteId;
  final String assetThumbhash;
  final double size;
  final int durationInMilliseconds;

  final Function()? onTap;

  const PositionedAssetMarkerIcon({
    required this.point,
    required this.assetRemoteId,
    required this.assetThumbhash,
    this.size = 100,
    this.durationInMilliseconds = 100,
    this.onTap,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final ratio = Platform.isIOS ? 1.0 : context.devicePixelRatio;
    return AnimatedPositioned(
      left: point.x / ratio - size / 2,
      top: point.y / ratio - size,
      duration: Duration(milliseconds: durationInMilliseconds),
      child: GestureDetector(
        onTap: () => onTap?.call(),
        child: SizedBox.square(
          dimension: size,
          child: AssetMarkerIcon(id: assetRemoteId, thumbhash: assetThumbhash, key: Key(assetRemoteId)),
        ),
      ),
    );
  }
}
