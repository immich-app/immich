import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' show useEffect, useState;
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/db.provider.dart';

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

    void clearCache() async {
      await isarDb.writeTxn(() => isarDb.duplicatedAssets.clear());
      cacheItemCount.value = await isarDb.duplicatedAssets.count();
    }

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      dense: true,
      title: Text(
        "cache_settings_duplicated_assets_title",
        style: context.textTheme.bodyLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ).tr(args: ["${cacheItemCount.value}"]),
      subtitle: const Text(
        "cache_settings_duplicated_assets_subtitle",
      ).tr(),
      trailing: TextButton(
        onPressed: cacheItemCount.value > 0 ? clearCache : null,
        child: Text(
          "cache_settings_duplicated_assets_clear_button",
          style: TextStyle(
            fontSize: 12,
            color: cacheItemCount.value > 0 ? Colors.red : Colors.grey,
            fontWeight: FontWeight.bold,
          ),
        ).tr(),
      ),
    );
  }
}
