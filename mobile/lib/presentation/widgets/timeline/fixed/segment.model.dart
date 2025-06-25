import 'dart:math' as math;

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
    index -= gridIndex;
    if (index < 0) {
      return startOffset;
    }
    return gridOffset + (mainAxisExtend * index);
  }

  @override
  int getMinChildIndexForScrollOffset(double scrollOffset) {
    scrollOffset -= gridOffset;
    if (!scrollOffset.isFinite || scrollOffset < 0) {
      return firstIndex;
    }
    final rowsAbove = (scrollOffset / mainAxisExtend).floor();
    return gridIndex + rowsAbove;
  }

  @override
  int getMaxChildIndexForScrollOffset(double scrollOffset) {
    scrollOffset -= gridOffset;
    if (!scrollOffset.isFinite || scrollOffset < 0) {
      return firstIndex;
    }
    final firstRowBelow = (scrollOffset / mainAxisExtend).ceil();
    return gridIndex + firstRowBelow - 1;
  }

  void _handleOnTap(WidgetRef ref, BaseAsset asset) {
    final multiSelectState = ref.read(multiSelectProvider);
    if (!multiSelectState.isEnabled) {
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

    return _buildRow(firstAssetIndex + assetIndex, numberOfAssets);
  }

  Widget _buildRow(int assetIndex, int count) => RepaintBoundary(
        child: Consumer(
          builder: (ctx, ref, _) {
            final isScrubbing =
                ref.watch(timelineStateProvider.select((s) => s.isScrubbing));
            final timelineService = ref.read(timelineServiceProvider);

            // Create stable callback references to prevent unnecessary rebuilds
            onTap(BaseAsset asset) => _handleOnTap(ref, asset);
            onLongPress(BaseAsset asset) => _handleOnLongPress(ref, asset);

            // Timeline is being scrubbed, show placeholders
            if (isScrubbing) {
              return SegmentBuilder.buildPlaceholder(
                ctx,
                count,
                size: Size.square(tileHeight),
                spacing: spacing,
              );
            }

            // Bucket is already loaded, show the assets
            if (timelineService.hasRange(assetIndex, count)) {
              final assets = timelineService.getAssets(assetIndex, count);
              return _buildAssetRow(
                ctx,
                assets,
                baseAssetIndex: assetIndex,
                onTap: onTap,
                onLongPress: onLongPress,
              );
            }

            // Bucket is not loaded, show placeholders and load the bucket
            return FutureBuilder(
              future: timelineService.loadAssets(assetIndex, count),
              builder: (ctxx, snap) {
                if (snap.connectionState != ConnectionState.done) {
                  return SegmentBuilder.buildPlaceholder(
                    ctx,
                    count,
                    size: Size.square(tileHeight),
                    spacing: spacing,
                  );
                }

                return _buildAssetRow(
                  ctxx,
                  snap.requireData,
                  baseAssetIndex: assetIndex,
                  onTap: onTap,
                  onLongPress: onLongPress,
                );
              },
            );
          },
        ),
      );

  Widget _buildAssetRow(
    BuildContext context,
    List<BaseAsset> assets, {
    required void Function(BaseAsset) onTap,
    required void Function(BaseAsset) onLongPress,
    required int baseAssetIndex,
  }) =>
      FixedTimelineRow(
        dimension: tileHeight,
        spacing: spacing,
        textDirection: Directionality.of(context),
        children: List.generate(
          assets.length,
          (i) => _AssetTileWidget(
            key: ValueKey(_generateUniqueKey(assets[i], baseAssetIndex + i)),
            asset: assets[i],
            onTap: onTap,
            onLongPress: onLongPress,
          ),
        ),
      );

  /// Generates a unique key for an asset that handles different asset types
  /// and prevents duplicate keys even when assets have the same name/timestamp
  String _generateUniqueKey(BaseAsset asset, int assetIndex) {
    // Try to get the most unique identifier based on asset type
    if (asset is Asset) {
      // For remote/merged assets, use the remote ID which is globally unique
      return 'asset_${asset.id}';
    } else if (asset is LocalAsset) {
      // For local assets, use the local ID which should be unique per device
      return 'local_${asset.id}';
    } else {
      // Fallback for any other BaseAsset implementation
      // Use checksum if available for additional uniqueness
      final checksum = asset.checksum;
      if (checksum != null && checksum.isNotEmpty) {
        return 'checksum_${checksum.hashCode}';
      } else {
        // Last resort: use global asset index + object hash for uniqueness
        return 'fallback_${assetIndex}_${asset.hashCode}_${asset.createdAt.microsecondsSinceEpoch}';
      }
    }
  }
}

class _AssetTileWidget extends StatelessWidget {
  final BaseAsset asset;
  final void Function(BaseAsset) onTap;
  final void Function(BaseAsset) onLongPress;

  const _AssetTileWidget({
    super.key,
    required this.asset,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: GestureDetector(
        onTap: () => onTap(asset),
        onLongPress: () => onLongPress(asset),
        child: ThumbnailTile(asset),
      ),
    );
  }
}
