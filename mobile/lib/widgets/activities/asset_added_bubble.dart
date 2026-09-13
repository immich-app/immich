import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/activities/activity.model.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail_tile.widget.dart';
import 'package:immich_mobile/widgets/activities/open_asset_viewer.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';
import 'package:openapi/api.dart' show AssetTypeEnum;

class AssetAddedBubble extends HookConsumerWidget {
  final List<Activity> activities;

  const AssetAddedBubble({super.key, required this.activities});

  static const _maxThumbnails = 10;
  static const _thumbnailSize = 76.0;
  static const _borderRadius = BorderRadius.all(Radius.circular(10));

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final first = activities.first;
    final expanded = useState(false);

    Widget buildTile(Activity activity, String assetId, {required VoidCallback onTap, Widget? overlay}) {
      return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: SizedBox(
          width: _thumbnailSize,
          height: _thumbnailSize,
          child: Stack(
            fit: StackFit.expand,
            children: [
              ClipRRect(
                borderRadius: _borderRadius,
                child: Image(
                  image: RemoteImageProvider.thumbnail(assetId: assetId, thumbhash: ""),
                  fit: BoxFit.cover,
                ),
              ),
              if (activity.assetType == AssetTypeEnum.VIDEO)
                const Positioned(top: 2, right: 2, child: TileOverlayIcon(Icons.play_circle_outline_rounded)),
              ?overlay,
            ],
          ),
        ),
      );
    }

    // the "+N" overlay covers the last visible tile, so that asset counts as hidden too
    final hasMore = !expanded.value && activities.length > _maxThumbnails;
    final visibleAssets = expanded.value ? activities : activities.take(_maxThumbnails).toList();
    final hiddenCount = activities.length - (_maxThumbnails - 1);

    final List<Widget> tiles = [];
    for (var i = 0; i < visibleAssets.length; i++) {
      final activity = visibleAssets[i];
      final assetId = activity.assetId;
      if (assetId == null || assetId.isEmpty) {
        continue;
      }

      final isOverflowTile = hasMore && i == _maxThumbnails - 1;
      tiles.add(
        isOverflowTile
            ? buildTile(
                activity,
                assetId,
                onTap: () => expanded.value = true,
                overlay: Container(
                  decoration: BoxDecoration(borderRadius: _borderRadius, color: Colors.black.withValues(alpha: 0.6)),
                  alignment: Alignment.center,
                  child: Text(
                    '+$hiddenCount',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ),
              )
            : buildTile(activity, assetId, onTap: () => openActivityAssetViewer(context, ref, assetId)),
      );
    }

    return Align(
      alignment: Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.86),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              UserCircleAvatar(user: first.user, size: 28),
              const SizedBox(width: 8),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.t.user_added_assets(
                        count: activities.length,
                        user: first.user.name,
                        type: getGroupMediaType(activities),
                      ),
                      style: context.textTheme.bodyMedium,
                    ),
                    if (tiles.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(spacing: 4, runSpacing: 4, children: tiles),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      first.createdAt.timeAgo(),
                      style: context.textTheme.labelMedium?.copyWith(
                        color: context.colorScheme.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
