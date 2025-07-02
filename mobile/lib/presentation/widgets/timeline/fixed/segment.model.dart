import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail_tile.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/row.dart';
import 'package:immich_mobile/presentation/widgets/timeline/header.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment_builder.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class FixedSegment extends Segment {
  final double tileHeight;
  final int columnCount;
  final double mainAxisExtend;

  const FixedSegment({
    required super.firstIndex,
    required super.lastIndex,
    required super.startOffset,
    required super.endOffset,
    required super.firstAssetIndex,
    required super.bucket,
    required this.tileHeight,
    required this.columnCount,
    required super.headerExtent,
    required super.spacing,
    required super.header,
  })  : assert(tileHeight != 0),
        mainAxisExtend = tileHeight + spacing;

  @override
  double indexToLayoutOffset(int index) {
    final relativeIndex = index - gridIndex;
    return relativeIndex < 0
        ? startOffset
        : gridOffset + (mainAxisExtend * relativeIndex);
  }

  @override
  int getMinChildIndexForScrollOffset(double scrollOffset) {
    final adjustedOffset = scrollOffset - gridOffset;
    if (!adjustedOffset.isFinite || adjustedOffset < 0) return firstIndex;
    return gridIndex + (adjustedOffset / mainAxisExtend).floor();
  }

  @override
  int getMaxChildIndexForScrollOffset(double scrollOffset) {
    final adjustedOffset = scrollOffset - gridOffset;
    if (!adjustedOffset.isFinite || adjustedOffset < 0) return firstIndex;
    return gridIndex + (adjustedOffset / mainAxisExtend).ceil() - 1;
  }

  @override
  Widget builder(BuildContext context, int index) {
    final rowIndexInSegment = index - (firstIndex + 1);
    final assetIndex = rowIndexInSegment * columnCount;
    final assetCount = bucket.assetCount;
    final numberOfAssets = math.min(columnCount, assetCount - assetIndex);

    if (index == firstIndex) {
      return TimelineHeader(
        bucket: bucket,
        header: header,
        height: headerExtent,
        assetOffset: firstAssetIndex,
      );
    }

    return _FixedSegmentRow(
      assetIndex: firstAssetIndex + assetIndex,
      assetCount: numberOfAssets,
      tileHeight: tileHeight,
      spacing: spacing,
    );
  }
}

class _FixedSegmentRow extends ConsumerWidget {
  final int assetIndex;
  final int assetCount;
  final double tileHeight;
  final double spacing;

  const _FixedSegmentRow({
    required this.assetIndex,
    required this.assetCount,
    required this.tileHeight,
    required this.spacing,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isScrubbing =
        ref.watch(timelineStateProvider.select((s) => s.isScrubbing));
    final timelineService = ref.read(timelineServiceProvider);

    if (isScrubbing) {
      return _buildPlaceholder(context);
    }

    if (timelineService.hasRange(assetIndex, assetCount)) {
      return _buildAssetRow(
        context,
        timelineService.getAssets(assetIndex, assetCount),
      );
    }

    return FutureBuilder<List<BaseAsset>>(
      future: timelineService.loadAssets(assetIndex, assetCount),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return _buildPlaceholder(context);
        }
        return _buildAssetRow(context, snapshot.requireData);
      },
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return SegmentBuilder.buildPlaceholder(
      context,
      assetCount,
      size: Size.square(tileHeight),
      spacing: spacing,
    );
  }

  Widget _buildAssetRow(BuildContext context, List<BaseAsset> assets) {
    return FixedTimelineRow(
      dimension: tileHeight,
      spacing: spacing,
      textDirection: Directionality.of(context),
      children: [
        for (int i = 0; i < assets.length; i++)
          _AssetTileWidget(
            key: ValueKey(assets[i].heroTag),
            asset: assets[i],
            assetIndex: assetIndex + i,
          ),
      ],
    );
  }
}

class _AssetTileWidget extends ConsumerWidget {
  final BaseAsset asset;
  final int assetIndex;

  const _AssetTileWidget({
    super.key,
    required this.asset,
    required this.assetIndex,
  });

  void _handleOnTap(
    BuildContext ctx,
    WidgetRef ref,
    int assetIndex,
    BaseAsset asset,
  ) {
    final multiSelectState = ref.read(multiSelectProvider);
    if (!multiSelectState.isEnabled) {
      ctx.pushRoute(
        AssetViewerRoute(
          initialIndex: assetIndex,
          timelineService: ref.read(timelineServiceProvider),
        ),
      );
      return;
    }

    ref.read(multiSelectProvider.notifier).toggleAssetSelection(asset);
  }

  void _handleOnLongPress(WidgetRef ref, BaseAsset asset) {
    final multiSelectState = ref.read(multiSelectProvider);
    if (multiSelectState.isEnabled) {
      return;
    }

    ref.read(hapticFeedbackProvider.notifier).heavyImpact();
    ref.read(multiSelectProvider.notifier).toggleAssetSelection(asset);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RepaintBoundary(
      child: GestureDetector(
        onTap: () => _handleOnTap(context, ref, assetIndex, asset),
        onLongPress: () => _handleOnLongPress(ref, asset),
        child: ThumbnailTile(asset),
      ),
    );
  }
}
