import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

const _kMaxMergeSelection = 5;

@RoutePage()
class DriftPersonMergePage extends ConsumerStatefulWidget {
  final DriftPerson person;

  const DriftPersonMergePage({super.key, required this.person});

  @override
  ConsumerState<DriftPersonMergePage> createState() => _DriftPersonMergePageState();
}

class _DriftPersonMergePageState extends ConsumerState<DriftPersonMergePage> {
  final Set<String> _selectedIds = {};
  bool _isMerging = false;

  void _toggleSelection(String personId) {
    setState(() {
      if (_selectedIds.contains(personId)) {
        _selectedIds.remove(personId);
        return;
      }

      if (_selectedIds.length >= _kMaxMergeSelection) {
        ref.read(toastRepositoryProvider).info(context.t.merge_people_limit);
        return;
      }

      _selectedIds.add(personId);
    });
  }

  Future<void> _confirmMerge() async {
    if (_selectedIds.isEmpty || _isMerging) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(context.t.merge_people, style: const TextStyle(fontWeight: FontWeight.bold)),
          content: Text(context.t.merge_people_prompt),
          actions: [
            TextButton(
              onPressed: () => ContextHelper(context).pop(false),
              child: Text(
                context.t.cancel,
                style: TextStyle(color: Colors.red[300], fontWeight: FontWeight.bold),
              ),
            ),
            TextButton(
              onPressed: () => ContextHelper(context).pop(true),
              child: Text(
                context.t.merge_people,
                style: TextStyle(color: context.primaryColor, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !context.mounted) {
      return;
    }

    setState(() => _isMerging = true);

    try {
      final result = await ref.read(driftPeopleServiceProvider).mergePerson(widget.person.id, _selectedIds.toList());

      if (!context.mounted) {
        return;
      }

      if (result.merged > 0) {
        ref.invalidate(driftGetAllPeopleProvider);

        ref.read(toastRepositoryProvider).success(context.t.merged_people_count(count: result.merged));

        final updatedPerson = await ref.read(driftPeopleServiceProvider).get(widget.person.id);

        if (!context.mounted) {
          return;
        }

        ContextHelper(context).pop(updatedPerson ?? widget.person);
      } else {
        ref.read(toastRepositoryProvider).error(context.t.cannot_merge_people);
      }
    } catch (error) {
      dPrint(() => 'Error merging people: $error');

      if (!context.mounted) {
        return;
      }

      ref.read(toastRepositoryProvider).error(context.t.scaffold_body_error_occurred);
    } finally {
      if (context.mounted) {
        setState(() => _isMerging = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final people = ref.watch(driftGetAllPeopleProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(context.t.merge_people),
        actions: [
          TextButton(
            onPressed: _selectedIds.isEmpty || _isMerging ? null : _confirmMerge,
            child: _isMerging
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Text(context.t.merge_people),
          ),
        ],
      ),
      body: SafeArea(
        child: people.when(
          data: (allPeople) {
            final candidates = allPeople.where((person) => person.id != widget.person.id).toList();

            return GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, childAspectRatio: 0.85),
              padding: const EdgeInsets.symmetric(vertical: 32),
              itemCount: candidates.length,
              itemBuilder: (context, index) {
                final person = candidates[index];
                final isSelected = _selectedIds.contains(person.id);

                return GestureDetector(
                  key: ValueKey(person.id),
                  onTap: () => _toggleSelection(person.id),
                  child: Column(
                    children: [
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          Material(
                            shape: CircleBorder(
                              side: BorderSide(color: isSelected ? context.primaryColor : Colors.transparent, width: 3),
                            ),
                            elevation: 3,
                            child: CircleAvatar(
                              maxRadius: 48,
                              backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(person.id)),
                            ),
                          ),
                          if (isSelected)
                            CircleAvatar(
                              radius: 12,
                              backgroundColor: context.primaryColor,
                              child: const Icon(Icons.check, size: 16, color: Colors.white),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Text(
                          person.name.isEmpty ? context.t.add_a_name : person.name,
                          overflow: TextOverflow.ellipsis,
                          style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
          error: (error, stack) => const Center(child: Text('error')),
          loading: () => const Center(child: CircularProgressIndicator()),
        ),
      ),
    );
  }
}
