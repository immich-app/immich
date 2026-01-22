import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:immich_mobile/widgets/map/map_settings/map_settings_list_tile.dart';
import 'package:immich_mobile/widgets/map/map_settings/map_settings_time_dropdown.dart';
import 'package:immich_mobile/widgets/map/map_settings/map_theme_picker.dart';

class DriftMapSettingsSheet extends HookConsumerWidget {
  const DriftMapSettingsSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mapState = ref.watch(mapStateProvider);

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.6,
      builder: (ctx, scrollController) => SingleChildScrollView(
        controller: scrollController,
        child: Card(
          elevation: 0.0,
          shadowColor: Colors.transparent,
          color: Colors.transparent,
          margin: EdgeInsets.zero,
          child: Column(
            mainAxisSize: MainAxisSize.max,
            children: [
              MapThemePicker(
                themeMode: mapState.themeMode,
                onThemeChange: (mode) => ref.read(mapStateProvider.notifier).switchTheme(mode),
              ),
              const Divider(height: 30, thickness: 1),
              MapSettingsListTile(
                title: "map_settings_only_show_favorites".t(context: context),
                selected: mapState.onlyFavorites,
                onChanged: (favoriteOnly) => ref.read(mapStateProvider.notifier).switchFavoriteOnly(favoriteOnly),
              ),
              MapSettingsListTile(
                title: "map_settings_include_show_archived".t(context: context),
                selected: mapState.includeArchived,
                onChanged: (includeArchive) =>
                    ref.read(mapStateProvider.notifier).switchIncludeArchived(includeArchive),
              ),
              MapSettingsListTile(
                title: "map_settings_include_show_partners".t(context: context),
                selected: mapState.withPartners,
                onChanged: (withPartners) => ref.read(mapStateProvider.notifier).switchWithPartners(withPartners),
              ),
              MapTimeDropDown(
                relativeTime: mapState.relativeDays,
                onTimeChange: (time) => ref.read(mapStateProvider.notifier).setRelativeTime(time),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
