import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/presentation/dialogs/people/manage_people_visibility_dialog.dart';
import 'package:immich_mobile/presentation/dialogs/people/merge_person_dialog.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/utils/people.utils.dart';
import 'package:immich_mobile/widgets/common/search_field.dart';
import 'package:openapi/api.dart';

@RoutePage()
class DriftPeopleCollectionPage extends ConsumerStatefulWidget {
  const DriftPeopleCollectionPage({super.key});

  @override
  ConsumerState<DriftPeopleCollectionPage> createState() => _DriftPeopleCollectionPageState();
}

class _DriftPeopleCollectionPageState extends ConsumerState<DriftPeopleCollectionPage> {
  final FocusNode _formFocus = FocusNode();
  String? _search;
  final Set<String> _selectedPersonIds = {};
  bool _isSelectionMode = false;

  @override
  void dispose() {
    _formFocus.dispose();
    super.dispose();
  }

  void _toggleSelection(String personId) {
    setState(() {
      if (_selectedPersonIds.contains(personId)) {
        _selectedPersonIds.remove(personId);
      } else {
        _selectedPersonIds.add(personId);
      }
    });
  }

  void _enterSelectionMode(String personId) {
    setState(() {
      _isSelectionMode = true;
      _selectedPersonIds.add(personId);
    });
  }

  void _exitSelectionMode() {
    setState(() {
      _isSelectionMode = false;
      _selectedPersonIds.clear();
    });
  }

  void _selectAll(List<DriftPerson> people) {
    setState(() {
      _selectedPersonIds.addAll(people.map((p) => p.id));
    });
  }

  void _deselectAll() {
    setState(() {
      _selectedPersonIds.clear();
    });
  }

  Future<void> _batchHideSelected() async {
    if (_selectedPersonIds.isEmpty) {
      return;
    }

    final updates = _selectedPersonIds.map((id) => PeopleUpdateItem(id: id, isHidden: true)).toList();
    try {
      final service = ref.read(driftPeopleServiceProvider);
      await service.updatePeopleHidden(updates);
      ref.invalidate(driftGetAllPeopleProvider);
      _exitSelectionMode();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('visibility_changed'.tr(namedArgs: {'count': '${updates.length}'}))));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('errors.unable_to_change_visibility'.tr(namedArgs: {'count': '${updates.length}'}))),
        );
      }
    }
  }

  void _showManageVisibilityDialog(BuildContext context) async {
    final result = await showManagePeopleVisibilityDialog(context);
    if (result == true && mounted) {
      ref.invalidate(driftGetAllPeopleProvider);
    }
  }

  void _showMergeDialog(BuildContext context, List<String> selectedIds) async {
    final people = ref.read(driftGetAllPeopleProvider).valueOrNull ?? [];
    final targetPerson = people.where((p) => selectedIds.contains(p.id)).firstOrNull;
    if (targetPerson == null) {
      return;
    }

    final candidateIds = selectedIds.where((id) => id != targetPerson.id).toList();

    final result = await showMergePersonDialog(context, targetPerson, preSelectedCandidateIds: candidateIds);

    if (result == true && mounted) {
      _exitSelectionMode();
      ref.invalidate(driftGetAllPeopleProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final people = ref.watch(driftGetAllPeopleProvider);
    final allPeopleCount = people.valueOrNull?.length ?? 0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isTablet = constraints.maxWidth > 600;
        final isPortrait = context.orientation == Orientation.portrait;

        return Scaffold(
          appBar: AppBar(
            automaticallyImplyLeading: _search == null || _isSelectionMode,
            leading: _isSelectionMode ? IconButton(icon: const Icon(Icons.close), onPressed: _exitSelectionMode) : null,
            title: _isSelectionMode
                ? Text('people_selected'.tr(namedArgs: {'count': '${_selectedPersonIds.length}'}))
                : _search != null
                ? SearchField(
                    focusNode: _formFocus,
                    onTapOutside: (_) => _formFocus.unfocus(),
                    onChanged: (value) => setState(() => _search = value),
                    filled: true,
                    hintText: 'filter_people'.tr(),
                    autofocus: true,
                  )
                : Text('people'.tr()),
            actions: [
              if (!_isSelectionMode) ...[
                IconButton(
                  icon: Icon(_search != null ? Icons.close : Icons.search),
                  onPressed: () {
                    setState(() => _search = _search == null ? '' : null);
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.visibility_off_outlined),
                  tooltip: 'show_and_hide_people'.tr(),
                  onPressed: () => _showManageVisibilityDialog(context),
                ),
              ] else ...[
                IconButton(
                  icon: Icon(_selectedPersonIds.length == allPeopleCount ? Icons.deselect : Icons.select_all),
                  tooltip: _selectedPersonIds.length == allPeopleCount ? 'deselect_all'.tr() : 'select_all'.tr(),
                  onPressed: () {
                    if (_selectedPersonIds.length == allPeopleCount) {
                      _deselectAll();
                      _exitSelectionMode();
                    } else {
                      final peopleData = ref.read(driftGetAllPeopleProvider).valueOrNull;
                      if (peopleData != null) {
                        _selectAll(peopleData);
                      }
                    }
                  },
                ),
              ],
            ],
          ),
          body: SafeArea(
            child: people.when(
              data: (people) {
                if (_search != null && !_isSelectionMode) {
                  people = people.where((person) {
                    return person.name.toLowerCase().contains(_search!.toLowerCase());
                  }).toList();
                }

                final effectiveCount = isTablet ? (isPortrait ? 4 : 8) : (isPortrait ? 3 : 6);

                return GridView.builder(
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: effectiveCount,
                    childAspectRatio: 0.85,
                    mainAxisSpacing: isPortrait && isTablet ? 36 : 0,
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 32),
                  itemCount: people.length,
                  itemBuilder: (context, index) {
                    final person = people[index];
                    final isSelected = _selectedPersonIds.contains(person.id);

                    return GestureDetector(
                      onLongPress: () {
                        if (!_isSelectionMode) {
                          _enterSelectionMode(person.id);
                        }
                      },
                      child: Column(
                        key: ValueKey(person.id),
                        children: [
                          GestureDetector(
                            onTap: () {
                              if (_isSelectionMode) {
                                _toggleSelection(person.id);
                                if (_selectedPersonIds.isEmpty) {
                                  _exitSelectionMode();
                                }
                              } else {
                                context.pushRoute(DriftPersonRoute(person: person));
                              }
                            },
                            child: Stack(
                              children: [
                                Material(
                                  shape: CircleBorder(
                                    side: BorderSide(color: isSelected ? Colors.blue : Colors.transparent, width: 3),
                                  ),
                                  elevation: 3,
                                  child: CircleAvatar(
                                    key: ValueKey('avatar-${person.id}'),
                                    maxRadius: isTablet ? 100 / 2 : 96 / 2,
                                    backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(person.id)),
                                  ),
                                ),
                                if (_isSelectionMode)
                                  Positioned(
                                    right: 0,
                                    bottom: 0,
                                    child: Container(
                                      width: 24,
                                      height: 24,
                                      decoration: BoxDecoration(
                                        color: isSelected ? Colors.blue : Colors.white,
                                        shape: BoxShape.circle,
                                        border: Border.all(color: isSelected ? Colors.blue : Colors.grey, width: 2),
                                      ),
                                      child: isSelected ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          GestureDetector(
                            onTap: () {
                              if (_isSelectionMode) {
                                _toggleSelection(person.id);
                              } else {
                                showNameEditModal(context, person);
                              }
                            },
                            child: person.name.isEmpty
                                ? Text(
                                    'add_a_name'.tr(),
                                    style: context.textTheme.titleSmall?.copyWith(
                                      fontWeight: FontWeight.w500,
                                      color: context.colorScheme.primary,
                                    ),
                                  )
                                : Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                    child: Text(
                                      person.name,
                                      overflow: TextOverflow.ellipsis,
                                      style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500),
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
              error: (error, stack) => const Text("error"),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
          bottomNavigationBar: _isSelectionMode && _selectedPersonIds.isNotEmpty
              ? BottomAppBar(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      TextButton.icon(
                        onPressed: _batchHideSelected,
                        icon: const Icon(Icons.visibility_off),
                        label: Text('hide_selected_people'.tr()),
                      ),
                      TextButton.icon(
                        onPressed: _selectedPersonIds.length >= 2
                            ? () => _showMergeDialog(context, _selectedPersonIds.toList())
                            : null,
                        icon: const Icon(Icons.merge),
                        label: Text('merge_selected_people'.tr()),
                      ),
                    ],
                  ),
                )
              : null,
        );
      },
    );
  }
}
