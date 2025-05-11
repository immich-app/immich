import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/map/map_state.provider.dart';
import 'package:immich_mobile/widgets/map/map_settings/map_settings_list_tile.dart';
import 'package:immich_mobile/widgets/map/map_settings/map_settings_time_dropdown.dart';
import 'package:immich_mobile/widgets/map/map_settings/map_theme_picker.dart';

class MapSettingsSheet extends HookConsumerWidget {
  const MapSettingsSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mapState = ref.watch(mapStateNotifierProvider);

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.6,
      builder: (ctx, scrollController) => SingleChildScrollView(
        controller: scrollController,
        child: Card(
          elevation: 0.0,
          shadowColor: Colors.transparent,
          margin: EdgeInsets.zero,
          child: Column(
            mainAxisSize: MainAxisSize.max,
            children: [
              MapThemePicker(
                themeMode: mapState.themeMode,
                onThemeChange: (mode) => ref
                    .read(mapStateNotifierProvider.notifier)
                    .switchTheme(mode),
              ),
              const Divider(height: 30, thickness: 2),
              MapSettingsListTile(
                title: "map_settings_only_show_favorites",
                selected: mapState.showFavoriteOnly,
                onChanged: (favoriteOnly) => ref
                    .read(mapStateNotifierProvider.notifier)
                    .switchFavoriteOnly(favoriteOnly),
              ),
              MapSettingsListTile(
                title: "map_settings_include_show_archived",
                selected: mapState.includeArchived,
                onChanged: (includeArchive) => ref
                    .read(mapStateNotifierProvider.notifier)
                    .switchIncludeArchived(includeArchive),
              ),
              MapSettingsListTile(
                title: "map_settings_include_show_partners",
                selected: mapState.withPartners,
                onChanged: (withPartners) => ref
                    .read(mapStateNotifierProvider.notifier)
                    .switchWithPartners(withPartners),
              ),
              MapTimeDropDown(
                relativeTime: mapState.relativeTime,
                onTimeChange: (time) => ref
                    .read(mapStateNotifierProvider.notifier)
                    .setRelativeTime(time),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
