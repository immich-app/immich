import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

@RoutePage()
class AssetSelectionTimelinePage extends StatelessWidget {
  final Set<BaseAsset> lockedSelectionAssets;
  const AssetSelectionTimelinePage({super.key, this.lockedSelectionAssets = const {}});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        multiSelectProvider.overrideWith(
          () => MultiSelectNotifier(
            MultiSelectState(selectedAssets: {}, lockedSelectionAssets: lockedSelectionAssets, forceEnable: true),
          ),
        ),
        timelineServiceProvider.overrideWith((ref) {
          final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull ?? [];
          final timelineService = ref.watch(timelineFactoryProvider).main(timelineUsers);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: const Timeline(showStorageIndicator: true),
    );
  }
}
