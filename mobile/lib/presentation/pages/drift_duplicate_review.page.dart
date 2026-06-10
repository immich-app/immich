import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/duplicates.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:openapi/api.dart';

@RoutePage()
class DriftDuplicateReviewPage extends ConsumerStatefulWidget {
  const DriftDuplicateReviewPage({super.key});

  @override
  ConsumerState<DriftDuplicateReviewPage> createState() => _DriftDuplicateReviewPageState();
}

class _DriftDuplicateReviewPageState extends ConsumerState<DriftDuplicateReviewPage> {
  final Map<String, Set<String>> _selectedToDelete = {};
  final Map<String, Set<String>> _selectedToKeep = {};

  @override
  Widget build(BuildContext context) {
    final duplicatesAsync = ref.watch(duplicateGroupsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('review_duplicates'.t(context: context)),
        centerTitle: true,
        elevation: 0,
      ),
      body: duplicatesAsync.when(
        data: (duplicates) {
          if (duplicates.isEmpty) {
            return Center(
              child: Text('no_duplicates_found'.t(context: context)),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: duplicates.length,
            itemBuilder: (context, index) {
              return _DuplicateGroupCard(
                index: index,
                duplicate: duplicates[index],
                selectedToDelete: _selectedToDelete,
                selectedToKeep: _selectedToKeep,
                onResolve: (keepIds, deleteIds) => _resolveDuplicate(
                  duplicates[index].duplicateId,
                  keepIds,
                  deleteIds,
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
    );
  }

  Future<void> _resolveDuplicate(String duplicateId, List<String> keepIds, List<String> deleteIds) async {
    try {
      final repository = ref.read(duplicatesRepositoryProvider);
      final resolveGroup = DuplicateResolveGroupDto(
        duplicateId: duplicateId,
        keepAssetIds: keepIds,
        trashAssetIds: deleteIds,
      );
      final resolveDto = DuplicateResolveDto(groups: [resolveGroup]);

      await repository.resolveDuplicates(resolveDto);

      // Refresh the duplicates list
      ref.refresh(duplicateGroupsProvider);

      ImmichToast.show(context: context, msg: 'Duplicates resolved');
    } catch (e) {
      ImmichToast.show(context: context, msg: 'Error: $e', toastType: ToastType.error);
    }
  }
}

class _DuplicateGroupCard extends StatefulWidget {
  final int index;
  final DuplicateResponseDto duplicate;
  final Map<String, Set<String>> selectedToDelete;
  final Map<String, Set<String>> selectedToKeep;
  final Function(List<String>, List<String>) onResolve;

  const _DuplicateGroupCard({
    required this.index,
    required this.duplicate,
    required this.selectedToDelete,
    required this.selectedToKeep,
    required this.onResolve,
  });

  @override
  State<_DuplicateGroupCard> createState() => _DuplicateGroupCardState();
}

class _DuplicateGroupCardState extends State<_DuplicateGroupCard> {
  late Set<String> _toDelete;
  late Set<String> _toKeep;

  @override
  void initState() {
    super.initState();
    _toDelete = widget.selectedToDelete.putIfAbsent(widget.duplicate.duplicateId, () => {});
    _toKeep = widget.selectedToKeep.putIfAbsent(widget.duplicate.duplicateId, () => {});
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Duplicate Group ${widget.index + 1}',
              style: context.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...widget.duplicate.assets.map((asset) {
              final isSuggested = widget.duplicate.suggestedKeepAssetIds.contains(asset.id);
              return _AssetTile(
                asset: asset,
                isSuggested: isSuggested,
                isSelectedToKeep: _toKeep.contains(asset.id),
                isSelectedToDelete: _toDelete.contains(asset.id),
                onKeepToggle: (selected) {
                  setState(() {
                    if (selected) {
                      _toKeep.add(asset.id);
                      _toDelete.remove(asset.id);
                    } else {
                      _toKeep.remove(asset.id);
                    }
                  });
                },
                onDeleteToggle: (selected) {
                  setState(() {
                    if (selected) {
                      _toDelete.add(asset.id);
                      _toKeep.remove(asset.id);
                    } else {
                      _toDelete.remove(asset.id);
                    }
                  });
                },
              );
            }),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: _toKeep.isNotEmpty && _toDelete.isNotEmpty
                      ? () => widget.onResolve(_toKeep.toList(), _toDelete.toList())
                      : null,
                  child: Text('keep'.t(context: context)),
                ),
                OutlinedButton(
                  onPressed: () {
                    // Dismiss duplicates without resolving
                  },
                  child: Text('dismiss_duplicates'.t(context: context)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AssetTile extends StatelessWidget {
  final AssetResponseDto asset;
  final bool isSuggested;
  final bool isSelectedToKeep;
  final bool isSelectedToDelete;
  final Function(bool) onKeepToggle;
  final Function(bool) onDeleteToggle;

  const _AssetTile({
    required this.asset,
    required this.isSuggested,
    required this.isSelectedToKeep,
    required this.isSelectedToDelete,
    required this.onKeepToggle,
    required this.onDeleteToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(
          color: isSelectedToKeep
              ? Colors.green
              : isSelectedToDelete
              ? Colors.red
              : Colors.grey.withAlpha(30),
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      asset.originalFileName,
                      style: context.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${asset.width}x${asset.height}',
                      style: context.textTheme.bodySmall,
                    ),
                    if (isSuggested)
                      Text(
                        'suggested_primary'.t(context: context),
                        style: context.textTheme.labelSmall?.copyWith(
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                  ],
                ),
              ),
              Checkbox(
                value: isSelectedToKeep,
                onChanged: (val) => onKeepToggle(val ?? false),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed: () => onKeepToggle(!isSelectedToKeep),
                icon: const Icon(Icons.check),
                label: Text('keep'.t(context: context)),
              ),
              TextButton.icon(
                onPressed: () => onDeleteToggle(!isSelectedToDelete),
                icon: const Icon(Icons.delete),
                label: Text('delete'.t(context: context)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
