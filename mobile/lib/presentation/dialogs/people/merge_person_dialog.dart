import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/person.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

Future<bool?> showMergePersonDialog(
  BuildContext context,
  DriftPerson currentPerson, {
  List<String>? preSelectedCandidateIds,
}) {
  return showDialog<bool>(
    context: context,
    useRootNavigator: false,
    builder: (context) =>
        MergePersonDialog(currentPerson: currentPerson, preSelectedCandidateIds: preSelectedCandidateIds),
  );
}

class MergePersonDialog extends ConsumerStatefulWidget {
  final DriftPerson currentPerson;
  final List<String>? preSelectedCandidateIds;

  const MergePersonDialog({super.key, required this.currentPerson, this.preSelectedCandidateIds});

  @override
  ConsumerState<MergePersonDialog> createState() => _MergePersonDialogState();
}

class _MergePersonDialogState extends ConsumerState<MergePersonDialog> {
  late Future<List<DriftPerson>> _futureCandidates;
  List<DriftPerson> _candidates = [];
  Set<String> _selectedCandidateIds = {};
  bool _isLoading = true;
  bool _isMerging = false;

  @override
  void initState() {
    super.initState();
    _loadCandidates();
  }

  void _loadCandidates() {
    setState(() {
      _futureCandidates = ref.read(driftPeopleServiceProvider).getAllPeopleWithHidden();
    });
  }

  Future<void> _onCandidatesLoaded(List<DriftPerson> people) async {
    // Filter out current person
    final candidates = people.where((p) => p.id != widget.currentPerson.id).toList();
    // Pre-select if provided
    final preSelected = widget.preSelectedCandidateIds?.toSet() ?? {};
    if (mounted) {
      setState(() {
        _candidates = candidates;
        _selectedCandidateIds = preSelected;
        _isLoading = false;
      });
    }
  }

  void _selectCandidate(DriftPerson candidate) {
    setState(() {
      if (_selectedCandidateIds.contains(candidate.id)) {
        _selectedCandidateIds = Set.from(_selectedCandidateIds)..remove(candidate.id);
      } else {
        _selectedCandidateIds = Set.from(_selectedCandidateIds)..add(candidate.id);
      }
    });
  }

  Future<void> _performMerge() async {
    if (_selectedCandidateIds.isEmpty) {
      return;
    }

    setState(() => _isMerging = true);

    try {
      final service = ref.read(driftPeopleServiceProvider);
      await service.mergePerson(widget.currentPerson.id, _selectedCandidateIds.toList());
      if (mounted) {
        Navigator.of(context).pop(true); // Return true to indicate merge happened
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('merge_people_successfully'.tr())));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isMerging = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('merge_people_failed'.tr())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 400, maxHeight: 600),
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
                  Icon(Icons.merge, color: context.colorScheme.onPrimaryContainer),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'merge_people'.tr(),
                      style: context.textTheme.titleLarge?.copyWith(color: context.colorScheme.onPrimaryContainer),
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.of(context).pop()),
                ],
              ),
            ),

            // Current person info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(widget.currentPerson.id)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.currentPerson.name.isEmpty ? 'unnamed_person'.tr() : widget.currentPerson.name,
                          style: context.textTheme.titleMedium,
                        ),
                        Text(
                          'merge_into_this_person'.tr(),
                          style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const Divider(),

            // Candidates list
            Expanded(
              child: _isLoading
                  ? FutureBuilder<List<DriftPerson>>(
                      future: _futureCandidates,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState == ConnectionState.waiting) {
                          return const Center(child: CircularProgressIndicator());
                        }
                        if (snapshot.hasError) {
                          return Center(child: Text('Error: ${snapshot.error}'));
                        }
                        if (snapshot.hasData) {
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            _onCandidatesLoaded(snapshot.data!);
                          });
                          return const SizedBox.shrink();
                        }
                        return const SizedBox.shrink();
                      },
                    )
                  : _candidates.isEmpty
                  ? Center(
                      child: Text(
                        'no_people_found'.tr(),
                        style: context.textTheme.bodyLarge?.copyWith(color: context.colorScheme.onSurfaceVariant),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _candidates.length,
                      itemBuilder: (context, index) {
                        final candidate = _candidates[index];
                        final isSelected = _selectedCandidateIds.contains(candidate.id);

                        return ListTile(
                          leading: CircleAvatar(
                            backgroundImage: RemoteImageProvider(url: getFaceThumbnailUrl(candidate.id)),
                          ),
                          title: Text(candidate.name.isEmpty ? 'unnamed_person'.tr() : candidate.name),
                          trailing: isSelected ? Icon(Icons.check_circle, color: context.colorScheme.primary) : null,
                          onTap: () => _selectCandidate(candidate),
                        );
                      },
                    ),
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
                    onPressed: _selectedCandidateIds.isEmpty || _isMerging ? null : _performMerge,
                    child: _isMerging
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : Text('merge'.tr()),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
