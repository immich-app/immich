import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/readonly_mode.provider.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';

class AssetDateTime extends ConsumerWidget {
  final Asset asset;

  const AssetDateTime({super.key, required this.asset});

  String getDateTimeString(Asset a) {
    final (deltaTime, timeZone) = a.getTZAdjustedTimeAndOffset();
    final date = DateFormat.yMMMEd().format(deltaTime);
    final time = DateFormat.jm().format(deltaTime);
    return '$date • $time GMT${timeZone.formatAsOffset()}';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final watchedAsset = ref.watch(assetDetailProvider(asset));
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);
    String formattedDateTime = getDateTimeString(asset);

    void editDateTime() async {
      await handleEditDateTime(ref, context, [asset]);

      if (watchedAsset.value != null) {
        formattedDateTime = getDateTimeString(watchedAsset.value!);
      }
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          formattedDateTime,
          style: context.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        if (asset.isRemote && !isReadonlyModeEnabled)
          IconButton(
            onPressed: editDateTime,
            icon: const Icon(Icons.edit_outlined),
            iconSize: 20,
          ),
      ],
    );
  }
}
