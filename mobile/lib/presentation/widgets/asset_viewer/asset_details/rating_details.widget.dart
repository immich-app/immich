import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/rating_bar.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';

class RatingDetails extends ConsumerWidget {
  const RatingDetails({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isRatingEnabled = ref
        .watch(userMetadataPreferencesProvider)
        .maybeWhen(data: (prefs) => prefs?.ratingsEnabled ?? false, orElse: () => false);

    if (!isRatingEnabled) return const SizedBox.shrink();

    final exifInfo = ref.watch(currentAssetExifProvider).valueOrNull;

    return Padding(
      padding: const EdgeInsets.only(left: 16.0, top: 16.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: 8,
        children: [
          Text(
            'rating'.t(context: context),
            style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurfaceSecondary),
          ),
          RatingBar(
            initialRating: exifInfo?.rating?.toDouble() ?? 0,
            filledColor: context.themeData.colorScheme.primary,
            unfilledColor: context.themeData.colorScheme.onSurface.withAlpha(100),
            itemSize: 40,
            onRatingUpdate: (rating) async {
              await ref.read(actionProvider.notifier).updateRating(ActionSource.viewer, rating.round());
            },
            onClearRating: () async {
              await ref.read(actionProvider.notifier).updateRating(ActionSource.viewer, 0);
            },
          ),
        ],
      ),
    );
  }
}
