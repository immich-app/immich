import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/server_stats.provider.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/widgets/settings/beta_sync_settings/entity_count_tile.dart';
import 'package:openapi/api.dart';

class ServerStatisticsPage extends ConsumerWidget {
  const ServerStatisticsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(serverStatsProvider);

    return statsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48),
            const SizedBox(height: 16),
            Text(tr("scaffold_body_error_occurred"), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.tonal(onPressed: () => ref.refresh(serverStatsProvider), child: const Text("refresh").tr()),
          ],
        ),
      ),
      data: (stats) => ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        children: [
          _ServerStatsOverview(stats: stats),
          if (stats.usageByUser.isNotEmpty) _UserUsageList(users: stats.usageByUser),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _ServerStatsOverview extends StatelessWidget {
  const _ServerStatsOverview({required this.stats});

  final ServerStatsResponseDto stats;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 16),
        Center(child: Text(tr("total_usage"), style: Theme.of(context).textTheme.titleMedium)),
        const SizedBox(height: 12),
        IntrinsicHeight(
          child: Flex(
            direction: Axis.horizontal,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 8.0,
            children: [
              Expanded(
                child: EntityCountTile(label: tr("photos"), count: stats.photos, icon: Icons.photo_library),
              ),
              Expanded(
                child: EntityCountTile(label: tr("videos"), count: stats.videos, icon: Icons.video_library),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        StorageTile(usage: stats.usage, usagePhotos: stats.usagePhotos, usageVideos: stats.usageVideos),
      ],
    );
  }
}

class _UserUsageList extends StatelessWidget {
  const _UserUsageList({required this.users});

  final List<UsageByUserDto> users;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 32),
        Center(child: Text(tr("user_usage_detail"), style: Theme.of(context).textTheme.titleMedium)),
        const SizedBox(height: 8),
        ...users.map((user) => _UserUsageCard(user: user)),
      ],
    );
  }
}

class _UserUsageCard extends StatelessWidget {
  const _UserUsageCard({required this.user});

  final UsageByUserDto user;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: context.colorScheme.surfaceContainerLow,
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: context.primaryColor.withAlpha(30),
              child: Text(
                user.userName.isNotEmpty ? user.userName[0].toUpperCase() : "?",
                style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.userName,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          "${tr("photos")}: ${_formatCount(user.photos)} • ${tr("videos")}: ${_formatCount(user.videos)}",
                          style: Theme.of(
                            context,
                          ).textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceVariant),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "${formatBytes(user.usage)}${user.quotaSizeInBytes != null ? " / ${formatBytes(user.quotaSizeInBytes!)}" : ""}",
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return "${(count / 1000000).toStringAsFixed(1)}M";
    } else if (count >= 1000) {
      return "${(count / 1000).toStringAsFixed(1)}K";
    }
    return count.toString();
  }
}

class StorageTile extends StatelessWidget {
  const StorageTile({super.key, required this.usage, required this.usagePhotos, required this.usageVideos});

  final int usage;
  final int usagePhotos;
  final int usageVideos;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.colorScheme.surfaceContainerLow,
        borderRadius: const BorderRadius.all(Radius.circular(16)),
        border: Border.all(width: 0.5, color: context.colorScheme.outline.withAlpha(25)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.storage, color: context.primaryColor, size: 14),
              const SizedBox(width: 4),
              Text(
                tr("storage"),
                style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.w500),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(formatBytes(usage), style: const TextStyle(fontSize: 18, fontFamily: 'GoogleSansCode')),
          const SizedBox(height: 4),
          Text(
            "${tr("photos")}: ${formatBytes(usagePhotos)} • ${tr("videos")}: ${formatBytes(usageVideos)}",
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
