import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/smart_cache.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/services/smart_cache.service.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_slider_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class SmartCacheSetting extends HookConsumerWidget {
  const SmartCacheSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isEnabled = useAppSettingsState(AppSettingsEnum.smartCacheEnabled);
    final cacheDays = useAppSettingsState(AppSettingsEnum.smartCacheHighResDays);
    final cacheStats = ref.watch(smartCacheStatsProvider);
    final preferRemoteEnabled = Store.get(StoreKey.preferRemoteImage, false);
    final description = "smart_cache_description".t(context: context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "smart_cache".t(context: context),
          icon: Icons.storage_outlined,
          subtitle: description.isEmpty ? null : description,
        ),
        if (preferRemoteEnabled)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              children: [
                Icon(Icons.info_outline, size: 18, color: context.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "smart_cache_prefer_remote_warning".t(context: context),
                    style: context.textTheme.bodySmall?.copyWith(
                      color: context.colorScheme.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        SettingsSwitchListTile(
          valueNotifier: isEnabled,
          title: "smart_cache_enabled".t(context: context),
          subtitle: "smart_cache_enabled_description".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        if (isEnabled.value) ...[
          SettingsSliderListTile(
            valueNotifier: cacheDays,
            text: cacheDays.value == 0
                ? "high_res_cache_duration_never".t(context: context)
                : "high_res_cache_duration".t(
                    context: context,
                    args: {'days': cacheDays.value.toString()},
                  ),
            maxValue: 30,
            minValue: 0,
            noDivisons: 30,
            label: cacheDays.value == 0 ? "Never" : "${cacheDays.value}",
            onChangeEnd: (_) => ref.invalidate(appSettingsServiceProvider),
          ),
          _buildCacheStats(context, ref, cacheStats),
          _buildCacheActions(context, ref),
        ],
      ],
    );
  }

  Widget _buildCacheStats(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<SmartCacheStats> cacheStats,
  ) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      dense: true,
      title: Text(
        "cache_stats".t(context: context),
        style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
      ),
      subtitle: cacheStats.when(
        data: (stats) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            _buildStatRow(
              context,
              "thumbnails".t(context: context),
              stats.thumbnailCount,
              stats.thumbnailSize,
            ),
            const SizedBox(height: 4),
            _buildStatRow(
              context,
              "high_res_images".t(context: context),
              stats.highResCount,
              stats.highResSize,
            ),
            const SizedBox(height: 4),
            _buildStatRow(
              context,
              "total".t(context: context),
              stats.totalCount,
              stats.totalSize,
              isBold: true,
            ),
          ],
        ),
        loading: () => Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            "loading".t(context: context),
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurfaceSecondary,
            ),
          ),
        ),
        error: (_, __) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            "error_loading_cache_stats".t(context: context),
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.error,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatRow(
    BuildContext context,
    String label,
    int count,
    int size, {
    bool isBold = false,
  }) {
    final textStyle = context.textTheme.bodyMedium?.copyWith(
      color: context.colorScheme.onSurfaceSecondary,
      fontWeight: isBold ? FontWeight.w600 : null,
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: textStyle),
        Text(
          "$count ${count == 1 ? 'file' : 'files'} (${formatHumanReadableBytes(size, 1)})",
          style: textStyle,
        ),
      ],
    );
  }

  Widget _buildCacheActions(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 20),
          dense: true,
          title: Text(
            "clear_high_res_cache".t(context: context),
            style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
          ),
          subtitle: Text(
            "clear_high_res_cache_description".t(context: context),
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurfaceSecondary,
            ),
          ),
          trailing: TextButton(
            onPressed: () => _clearHighResCache(context, ref),
            child: Text(
              "clear".t(context: context),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 20),
          dense: true,
          title: Text(
            "clear_all_cache".t(context: context),
            style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
          ),
          subtitle: Text(
            "clear_all_cache_description".t(context: context),
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurfaceSecondary,
            ),
          ),
          trailing: TextButton(
            onPressed: () => _clearAllCache(context, ref),
            child: Text(
              "clear".t(context: context),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.red.shade400,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _clearHighResCache(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text("clear_high_res_cache".t(context: context)),
        content: Text("clear_high_res_cache_confirm".t(context: context)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text("cancel".t(context: context)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text("clear".t(context: context)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(smartCacheServiceProvider).clearHighResCache();
      ref.invalidate(smartCacheStatsProvider);
      if (context.mounted) {
        context.scaffoldMessenger.showSnackBar(
          SnackBar(
            content: Text("cache_cleared".t(context: context)),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  Future<void> _clearAllCache(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text("clear_all_cache".t(context: context)),
        content: Text("clear_all_cache_confirm".t(context: context)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text("cancel".t(context: context)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text("clear".t(context: context)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(smartCacheServiceProvider).clearAllCache();
      ref.invalidate(smartCacheStatsProvider);
      if (context.mounted) {
        context.scaffoldMessenger.showSnackBar(
          SnackBar(
            content: Text("cache_cleared".t(context: context)),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }
}
