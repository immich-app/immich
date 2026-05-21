import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:openapi/api.dart';

class ManagePeopleVisibilityDialog extends ConsumerStatefulWidget {
  const ManagePeopleVisibilityDialog({super.key});

  @override
  ConsumerState<ManagePeopleVisibilityDialog> createState() => _ManagePeopleVisibilityDialogState();
}

class _ManagePeopleVisibilityDialogState extends ConsumerState<ManagePeopleVisibilityDialog> {
  late Future<List<DriftPerson>> _futurePeople;
  Map<String, bool> _hiddenStates = {};
  Map<String, bool> _originalStates = {};
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadPeople();
  }

  void _loadPeople() {
    setState(() {
      _isLoading = true;
      _futurePeople = ref.read(driftPeopleServiceProvider).getAllPeopleWithHidden();
    });
  }

  Future<void> _onPeopleLoaded(List<DriftPerson> people) async {
    final Map<String, bool> hidden = {};
    final Map<String, bool> original = {};
    for (final p in people) {
      hidden[p.id] = p.isHidden;
      original[p.id] = p.isHidden;
    }
    if (mounted) {
      setState(() {
        _hiddenStates = hidden;
        _originalStates = original;
        _isLoading = false;
      });
    }
  }

  void _toggleHidden(String id) {
    setState(() {
      _hiddenStates[id] = !(_hiddenStates[id] ?? false);
    });
  }

  void _showAll() {
    setState(() {
      for (final id in _hiddenStates.keys) {
        _hiddenStates[id] = false;
      }
    });
  }

  void _hideAll() {
    setState(() {
      for (final id in _hiddenStates.keys) {
        _hiddenStates[id] = true;
      }
    });
  }

  void _hideUnnamed() {
    // Get the people to check names - we need to reload for this
    setState(() {
      // Will be handled in the grid build
    });
  }

  void _reset() {
    setState(() {
      _hiddenStates = Map.from(_originalStates);
    });
  }

  bool get _hasChanges {
    for (final id in _hiddenStates.keys) {
      if (_hiddenStates[id] != _originalStates[id]) {
        return true;
      }
    }
    return false;
  }

  Future<void> _save() async {
    if (!_hasChanges) {
      Navigator.of(context).pop();
      return;
    }

    setState(() => _isSaving = true);

    try {
      final service = ref.read(driftPeopleServiceProvider);
      final List<PeopleUpdateItem> updates = [];

      for (final id in _hiddenStates.keys) {
        if (_hiddenStates[id] != _originalStates[id]) {
          updates.add(PeopleUpdateItem(id: id, isHidden: _hiddenStates[id]));
        }
      }

      if (updates.isNotEmpty) {
        await service.updatePeopleHidden(updates);
      }

      if (mounted) {
        Navigator.of(context).pop(true); // Return true to indicate changes were made
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update people: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500, maxHeight: 700),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.colorScheme.primaryContainer,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Row(
                children: [
                  Icon(Icons.visibility_off, color: context.colorScheme.onPrimaryContainer),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'show_and_hide_people'.tr(),
                      style: context.textTheme.titleLarge?.copyWith(color: context.colorScheme.onPrimaryContainer),
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.of(context).pop()),
                ],
              ),
            ),
            // Quick actions
            Padding(
              padding: const EdgeInsets.all(16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _ActionChip(icon: Icons.visibility, label: 'show_all_people'.tr(), onTap: _showAll),
                  _ActionChip(icon: Icons.visibility_off, label: 'hide_all_people'.tr(), onTap: _hideAll),
                  _ActionChip(icon: Icons.person_off, label: 'hide_unnamed_people'.tr(), onTap: _hideUnnamed),
                  _ActionChip(
                    icon: Icons.undo,
                    label: 'reset_people_visibility'.tr(),
                    onTap: _reset,
                    enabled: _hasChanges,
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // Grid
            Expanded(
              child: _isLoading
                  ? FutureBuilder<List<DriftPerson>>(
                      future: _futurePeople,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }
                        if (snapshot.hasError) {
                          return Center(child: Text('Error: ${snapshot.error}'));
                        }
                        if (snapshot.hasData) {
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            _onPeopleLoaded(snapshot.data!);
                          });
                          return const SizedBox.shrink();
                        }
                        return const SizedBox.shrink();
                      },
                    )
                  : _buildGrid(),
            ),
            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(onPressed: () => Navigator.of(context).pop(), child: Text('cancel'.tr())),
                  const SizedBox(width: 12),
                  FilledButton(
                    onPressed: _isSaving ? null : _save,
                    child: _isSaving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : Text('done'.tr()),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrid() {
    if (_hiddenStates.isEmpty && !_isLoading) {
      return Center(child: Text('No people found'.t()));
    }

    return FutureBuilder<List<DriftPerson>>(
      future: _futurePeople,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final people = snapshot.data!;

        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            childAspectRatio: 0.8,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
          ),
          itemCount: people.length,
          itemBuilder: (context, index) {
            final person = people[index];
            final isHidden = _hiddenStates[person.id] ?? person.isHidden;

            return _PersonVisibilityCard(person: person, isHidden: isHidden, onTap: () => _toggleHidden(person.id));
          },
        );
      },
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool enabled;

  const _ActionChip({required this.icon, required this.label, required this.onTap, this.enabled = true});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: enabled ? context.colorScheme.surfaceContainerHighest : Colors.grey.shade300,
      borderRadius: const BorderRadius.all(Radius.circular(20)),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: enabled ? null : Colors.grey),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(color: enabled ? null : Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}

class _PersonVisibilityCard extends StatelessWidget {
  final DriftPerson person;
  final bool isHidden;
  final VoidCallback onTap;

  const _PersonVisibilityCard({required this.person, required this.isHidden, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: isHidden ? Colors.orange : Colors.green, width: 3),
                ),
                child: CircleAvatar(
                  radius: 40,
                  backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(person.id)),
                ),
              ),
              if (isHidden)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Colors.orange, shape: BoxShape.circle),
                    child: const Icon(Icons.visibility_off, size: 16, color: Colors.white),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            person.name.isEmpty ? 'unnamed_person'.tr() : person.name,
            style: context.textTheme.bodySmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// Helper function to show the dialog
Future<bool?> showManagePeopleVisibilityDialog(BuildContext context) {
  return showDialog<bool>(
    context: context,
    useRootNavigator: false,
    builder: (context) => const ManagePeopleVisibilityDialog(),
  );
}
