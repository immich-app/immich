import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';

class AssetDateTime extends ConsumerWidget {
  final Asset asset;

  const AssetDateTime({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (dt, timeZone) = (asset).getTZAdjustedTimeAndOffset();
    final date = DateFormat.yMMMEd().format(dt);
    final time = DateFormat.jm().format(dt);
    String formattedDateTime = '$date • $time GMT${timeZone.formatAsOffset()}';

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          formattedDateTime,
          style: context.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        if (asset.isRemote)
          IconButton(
            onPressed: () => handleEditDateTime(
              ref,
              context,
              [asset],
            ),
            icon: const Icon(Icons.edit_outlined),
            iconSize: 20,
          ),
      ],
    );
  }
}
