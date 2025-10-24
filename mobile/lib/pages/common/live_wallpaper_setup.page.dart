import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/domain/models/live_wallpaper_preferences.model.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/live_wallpaper_platform.provider.dart';
import 'package:immich_mobile/providers/live_wallpaper_preferences.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

@RoutePage()
class LiveWallpaperSetupPage extends HookConsumerWidget {
  const LiveWallpaperSetupPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final preferences = ref.watch(liveWallpaperPreferencesProvider);
    final notifier = ref.watch(liveWallpaperPreferencesProvider.notifier);
    final openPicker = ref.watch(openWallpaperPickerProvider);

    final searchQuery = useState('');
    final selected = useState<Set<String>>(preferences.personIds.toSet());
    final rotationMode = useState<RotationMode>(preferences.rotationMode);

    useEffect(() {
      selected.value = preferences.personIds.toSet();
      rotationMode.value = preferences.rotationMode;
      return null;
    }, [preferences.personIds, preferences.rotationMode]);

    final peopleAsync = ref.watch(driftGetAllPeopleProvider);

    void togglePerson(String personId) {
      final next = Set<String>.from(selected.value);
      if (next.contains(personId)) {
        next.remove(personId);
      } else {
        next.add(personId);
      }
      selected.value = next;
      notifier.setPersonIds(next.toList());
    }

    void onRotationChanged(RotationMode mode) {
      rotationMode.value = mode;
      notifier.setRotationMode(mode);
      notifier.setRotationInterval(mode.duration);
    }

    void onAllowCellularChanged(bool value) {
      notifier.setAllowCellular(value);
    }

    Future<void> onSetWallpaper() async {
      if (selected.value.isEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('live_wallpaper_setup_select_people_first'.tr())));
        return;
      }

      final wasEnabled = preferences.enabled;
      await notifier.toggleEnabled(true);

      try {
        final opened = await openPicker();
        if (!context.mounted) return;

        final key = opened ? 'live_wallpaper_setting_open_picker_success' : 'live_wallpaper_setting_open_picker_failed';
        if (!opened && !wasEnabled) {
          await notifier.toggleEnabled(false);
        }
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(key.tr())));
      } catch (error) {
        if (!wasEnabled) {
          await notifier.toggleEnabled(false);
        }
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('live_wallpaper_status_error'.tr(namedArgs: {'error': error.toString()}))),
          );
        }
      }
    }

    return Scaffold(
      appBar: AppBar(title: Text('live_wallpaper_setup_title'.tr())),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: 'live_wallpaper_setup_search_hint'.tr(),
                border: const OutlineInputBorder(),
              ),
              onChanged: (value) => searchQuery.value = value,
            ),
            const SizedBox(height: 12),
            Expanded(
              child: peopleAsync.when(
                data: (people) => _PeopleGrid(
                  people: _filterPeople(people, searchQuery.value),
                  selected: selected.value,
                  onPersonTap: togglePerson,
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => Center(child: Text('live_wallpaper_setup_error_loading_people'.tr())),
              ),
            ),
            const SizedBox(height: 16),
            _RotationControl(mode: rotationMode.value, onChanged: onRotationChanged),
            SwitchListTile.adaptive(
              value: preferences.allowCellularData,
              onChanged: onAllowCellularChanged,
              title: Text('live_wallpaper_setup_allow_cellular'.tr()),
              subtitle: Text('live_wallpaper_setup_allow_cellular_subtitle'.tr()),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.wallpaper),
                label: Text('live_wallpaper_setup_enable_button'.tr()),
                onPressed: onSetWallpaper,
              ),
            ),
          ],
        ),
      ),
    );
  }

  static List<DriftPerson> _filterPeople(List<DriftPerson> people, String search) {
    if (search.isEmpty) {
      return people;
    }
    final lower = search.toLowerCase();
    return people.where((person) => person.name.toLowerCase().contains(lower)).toList();
  }
}

class _PeopleGrid extends StatelessWidget {
  const _PeopleGrid({required this.people, required this.selected, required this.onPersonTap});

  final List<DriftPerson> people;
  final Set<String> selected;
  final ValueChanged<String> onPersonTap;

  @override
  Widget build(BuildContext context) {
    final headers = ApiService.getRequestHeaders();
    if (people.isEmpty) {
      return Center(child: Text('live_wallpaper_setup_no_results'.tr()));
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final estimated = (constraints.maxWidth / 110).floor();
        final count = estimated.clamp(2, 4);

        return GridView.builder(
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: count,
            childAspectRatio: 0.72,
            crossAxisSpacing: 10,
            mainAxisSpacing: 16,
          ),
          itemCount: people.length,
          itemBuilder: (context, index) {
            final person = people[index];
            final isSelected = selected.contains(person.id);
            final imageUrl = getFaceThumbnailUrl(person.id);

            return GestureDetector(
              onTap: () => onPersonTap(person.id),
              child: Column(
                children: [
                  Stack(
                    alignment: Alignment.topRight,
                    children: [
                      CircleAvatar(radius: 42, backgroundImage: NetworkImage(imageUrl, headers: headers)),
                      if (isSelected)
                        Container(
                          margin: const EdgeInsets.all(4),
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.check, size: 16, color: Colors.white),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    person.name.isEmpty ? 'live_wallpaper_setup_unknown_person'.tr() : person.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _RotationControl extends StatelessWidget {
  const _RotationControl({required this.mode, required this.onChanged});

  final RotationMode mode;
  final ValueChanged<RotationMode> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('live_wallpaper_setup_rotation_label'.tr()),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: RotationMode.values.map((rotationMode) {
              final isSelected = mode == rotationMode;
              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: FilterChip(
                  label: Text(rotationMode.label),
                  selected: isSelected,
                  onSelected: (_) => onChanged(rotationMode),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
