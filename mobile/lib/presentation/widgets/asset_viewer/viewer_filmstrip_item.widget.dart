import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';

abstract final class FilmstripMetrics {
  static const itemExtent = 20.0;
  static const itemGap = 3.0;
  static const itemSlot = itemExtent + itemGap;
  static const stripHeight = 30.0;
  static const expandedScale = 1.5;
  static const expandedGap = 13.0;

  static ({double dx, double width}) itemGeometry(int index, {required double focus, required double expansion}) {
    final before = focus.floor();
    var dx = 0.0;
    var width = itemExtent;
    for (final (expanded, weight) in [(before, 1 - (focus - before)), (before + 1, focus - before)]) {
      final grow = expansion * weight * itemExtent * (expandedScale - 1);
      final shift = grow / 2 + expansion * weight * (expandedGap - itemGap);
      if (index == expanded) {
        width += grow;
      } else {
        dx += index < expanded ? -shift : shift;
      }
    }
    return (dx: dx, width: width);
  }

  static int? indexAt(double contentX, {required int total, required double focus, required double expansion}) {
    double distanceTo(int index) {
      final (:dx, :width) = itemGeometry(index, focus: focus, expansion: expansion);
      final left = index * itemSlot + (itemExtent - width) / 2 + dx;
      return max(max(left - contentX, contentX - left - width), 0);
    }

    final guess = (contentX / itemSlot).floor().clamp(0, total - 1);
    final nearest = [
      guess - 1,
      guess,
      guess + 1,
    ].where((index) => index >= 0 && index < total).reduce((a, b) => distanceTo(b) < distanceTo(a) ? b : a);
    return distanceTo(nearest) < itemSlot ? nearest : null;
  }
}

class FilmstripItem extends StatelessWidget {
  final BaseAsset? asset;
  final Size? remoteSize;
  final int index;
  final ValueListenable<double> focus;
  final Animation<double> expansion;

  const FilmstripItem({
    super.key,
    required this.asset,
    required this.remoteSize,
    required this.index,
    required this.focus,
    required this.expansion,
  });

  static const _radius = BorderRadius.all(Radius.circular(3));

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([focus, expansion]),
      builder: (context, child) {
        final (:dx, :width) = FilmstripMetrics.itemGeometry(index, focus: focus.value, expansion: expansion.value);
        return Transform.translate(
          offset: Offset(dx, 0),
          child: Padding(
            padding: const EdgeInsets.only(right: FilmstripMetrics.itemGap),
            child: OverflowBox(minWidth: width, maxWidth: width, child: child),
          ),
        );
      },
      child: ClipRRect(
        borderRadius: _radius,
        child: Thumbnail.fromAsset(asset: asset, remoteSize: remoteSize, fit: BoxFit.cover),
      ),
    );
  }
}
