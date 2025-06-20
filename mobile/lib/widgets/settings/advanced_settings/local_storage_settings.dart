import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' show useEffect, useState;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

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

    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: "Placeholder",
      ),
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            'cache_settings_duplicated_assets_title'
                .t(context: context, args: {'count': cacheItemCount.value}),
            style: context.textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w500,
              color: context.colorScheme.onSurface,
              letterSpacing: 0,
            ),
          ),
          subtitle: Text(
            'cache_settings_duplicated_assets_subtitle'.t(context: context),
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurfaceSecondary,
              height: 1.4,
              letterSpacing: 0,
            ),
          ),
          trailing: TextButton(
            onPressed: cacheItemCount.value > 0 ? clearCache : null,
            child: Text(
              'cache_settings_duplicated_assets_clear_button'
                  .t(context: context),
              style: TextStyle(
                fontSize: 12,
                color: cacheItemCount.value > 0
                    ? context.colorScheme.error
                    : context.themeData.disabledColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
