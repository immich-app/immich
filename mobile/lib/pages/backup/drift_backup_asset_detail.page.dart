import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/routing/router.dart';

@RoutePage()
class DriftBackupAssetDetailPage extends ConsumerWidget {
  const DriftBackupAssetDetailPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    AsyncValue<List<LocalAsset>> result = ref.watch(driftBackupCandidateProvider);
    return Scaffold(
      appBar: AppBar(title: Text('backup_controller_page_remainder'.t(context: context))),
      body: result.when(
        data: (List<LocalAsset> candidates) {
          return ListView.separated(
            padding: const EdgeInsets.only(top: 16.0),
            separatorBuilder: (context, index) => Divider(color: context.colorScheme.outlineVariant),
            itemCount: candidates.length,
            itemBuilder: (context, index) {
              final asset = candidates[index];
              final albumsAsyncValue = ref.watch(driftCandidateBackupAlbumInfoProvider(asset.id));
              return LargeLeadingTile(
                title: Text(
                  asset.name,
                  style: context.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500, fontSize: 16),
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      asset.createdAt.toString(),
                      style: TextStyle(fontSize: 13.0, color: context.colorScheme.onSurfaceSecondary),
                    ),
                    Text(
                      asset.checksum ?? "N/A",
                      style: TextStyle(fontSize: 13.0, color: context.colorScheme.onSurfaceSecondary),
                      overflow: TextOverflow.ellipsis,
                    ),
                    albumsAsyncValue.when(
                      data: (albums) {
                        if (albums.isEmpty) {
                          return const SizedBox.shrink();
                        }
                        return Text(
                          albums.map((a) => a.name).join(', '),
                          style: context.textTheme.labelLarge?.copyWith(color: context.primaryColor),
                          overflow: TextOverflow.ellipsis,
                        );
                      },
                      error: (error, stackTrace) => Text(
                        'error_saving_image'.tr(args: [error.toString()]),
                        style: TextStyle(color: context.colorScheme.error),
                      ),
                      loading: () => const SizedBox(height: 16, width: 16, child: CircularProgressIndicator.adaptive()),
                    ),
                  ],
                ),
                leading: ClipRRect(
                  borderRadius: const BorderRadius.all(Radius.circular(12)),
                  child: SizedBox(
                    width: 64,
                    height: 64,
                    child: Thumbnail.fromAsset(asset: asset, size: const Size(64, 64), fit: BoxFit.cover),
                  ),
                ),
                trailing: const Padding(padding: EdgeInsets.only(right: 24, left: 8), child: Icon(Icons.image_search)),
                onTap: () async {
                  await context.maybePop();
                  await context.navigateTo(const TabShellRoute(children: [MainTimelineRoute()]));
                  EventStream.shared.emit(ScrollToDateEvent(asset.createdAt));
                },
              );
            },
          );
        },
        error: (Object error, StackTrace stackTrace) {
          return Center(child: Text('error_saving_image'.tr(args: [error.toString()])));
        },
        loading: () {
          return const SizedBox(height: 48, width: 48, child: Center(child: CircularProgressIndicator.adaptive()));
        },
      ),
    );
  }
}
