import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' show useEffect, useState;
import 'package:immich_mobile/modules/backup/models/duplicated_asset.model.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';

class LocalStorageSettings extends HookConsumerWidget {
  const LocalStorageSettings({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isarDb = ref.watch(dbProvider);
    final cacheItemCount = useState(0);
    useEffect(
      () {
        cacheItemCount.value = isarDb.duplicatedAssets.countSync();
        return null;
      },
      [],
    );

    void clearCache() {
      isarDb.writeTxnSync(() => isarDb.duplicatedAssets.clearSync());
      cacheItemCount.value = isarDb.duplicatedAssets.countSync();
    }

    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        "cache_settings_tile_title",
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        "cache_settings_tile_subtitle",
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: [
        ListTile(
          title: Text(
            "Duplicated Assets (${cacheItemCount.value})",
            style: Theme.of(context)
                .textTheme
                .labelLarge
                ?.copyWith(fontWeight: FontWeight.bold),
          ).tr(),
          subtitle: const Text(
            "Photos and videos that are black listed by the app",
            style: TextStyle(
              fontSize: 13,
            ),
          ).tr(),
          trailing: TextButton(
            onPressed: cacheItemCount.value > 0 ? clearCache : null,
            child: Text(
              "CLEAR",
              style: TextStyle(
                fontSize: 12,
                color: cacheItemCount.value > 0 ? Colors.red : Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ).tr(),
          ),
        ),
      ],
    );
  }
}
