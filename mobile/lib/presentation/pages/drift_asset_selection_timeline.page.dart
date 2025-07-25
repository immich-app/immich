import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

@RoutePage()
class DriftAssetSelectionTimelinePage extends ConsumerWidget {
  final Set<BaseAsset> lockedSelectionAssets;
  const DriftAssetSelectionTimelinePage({
    super.key,
    this.lockedSelectionAssets = const {},
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ProviderScope(
      overrides: [
        multiSelectProvider.overrideWith(
          () => MultiSelectNotifier(
            MultiSelectState(
              selectedAssets: {},
              lockedSelectionAssets: lockedSelectionAssets,
              forceEnable: true,
            ),
          ),
        ),
        timelineServiceProvider.overrideWith(
          (ref) {
            final user = ref.watch(currentUserProvider);
            if (user == null) {
              throw Exception(
                'User must be logged in to access asset selection timeline',
              );
            }

            final timelineService =
                ref.watch(timelineFactoryProvider).remoteAssets(user.id);
            ref.onDispose(timelineService.dispose);
            return timelineService;
          },
        ),
      ],
      child: const Timeline(),
    );
  }
}
