import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/duplicates.provider.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:openapi/api.dart';
import 'package:octo_image/octo_image.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';

@RoutePage()
class DriftDuplicateReviewPage extends ConsumerStatefulWidget {
  const DriftDuplicateReviewPage({super.key});

  @override
  ConsumerState<DriftDuplicateReviewPage> createState() =>
      _DriftDuplicateReviewPageState();
}

class _DriftDuplicateReviewPageState
    extends ConsumerState<DriftDuplicateReviewPage> {
  int _currentIndex = 0;

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

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: _DuplicateGroupCard(
                      duplicate: duplicates[_currentIndex],
                      onResolve: (keepIds, deleteIds) =>
                          _resolveDuplicate(
                            duplicates[_currentIndex].duplicateId,
                            keepIds,
                            deleteIds,
                            duplicates,
                          ),
                    ),
                  ),
                ),
              ),
              // Navigation controls
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ElevatedButton.icon(
                      onPressed: _currentIndex > 0
                          ? () => setState(() => _currentIndex--)
                          : null,
                      icon: const Icon(Icons.navigate_before),
                      label: Text('previous'.t(context: context)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: context.colorScheme.outline),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_currentIndex + 1} / ${duplicates.length}',
                        style: context.textTheme.labelLarge,
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: _currentIndex < duplicates.length - 1
                          ? () => setState(() => _currentIndex++)
                          : null,
                      icon: const Icon(Icons.navigate_next),
                      label: Text('next'.t(context: context)),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
    );
  }

  Future<void> _resolveDuplicate(
      String duplicateId,
      List<String> keepIds,
      List<String> deleteIds,
      List<DuplicateResponseDto> duplicates,
      ) async {
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
      ImmichToast.show(
        context: context,
        msg: 'Error: $e',
        toastType: ToastType.error,
      );
    }
  }
}

class _DuplicateGroupCard extends StatefulWidget {
  final DuplicateResponseDto duplicate;
  final Function(List<String>, List<String>) onResolve;

  const _DuplicateGroupCard({
    required this.duplicate,
    required this.onResolve,
  });

  @override
  State<_DuplicateGroupCard> createState() => _DuplicateGroupCardState();
}

class _DuplicateGroupCardState extends State<_DuplicateGroupCard> {
  late Set<String> _selectedToKeep;
  late Set<String> _selectedToDelete;

  @override
  void initState() {
    super.initState();
    _selectedToKeep = Set.from(widget.duplicate.suggestedKeepAssetIds);
    _selectedToDelete = {};
  }

  @override
  Widget build(BuildContext context) {
    final assets = widget.duplicate.assets;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title
            Text(
              'Duplicate Group',
              style: context.textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Assets side by side (horizontally scrollable)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: assets
                    .map(
                      (asset) => _DuplicateAssetCard(
                    asset: asset,
                    isSuggested:
                    widget.duplicate.suggestedKeepAssetIds
                        .contains(asset.id),
                    isSelectedToKeep:
                    _selectedToKeep.contains(asset.id),
                    isSelectedToDelete:
                    _selectedToDelete.contains(asset.id),
                    onKeepToggle: (selected) {
                      setState(() {
                        if (selected) {
                          _selectedToKeep.add(asset.id);
                          _selectedToDelete.remove(asset.id);
                        } else {
                          _selectedToKeep.remove(asset.id);
                        }
                      });
                    },
                    onDeleteToggle: (selected) {
                      setState(() {
                        if (selected) {
                          _selectedToDelete.add(asset.id);
                          _selectedToKeep.remove(asset.id);
                        } else {
                          _selectedToDelete.remove(asset.id);
                        }
                      });
                    },
                  ),
                )
                    .toList(),
              ),
            ),

            const SizedBox(height: 24),

            // Action buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton.icon(
                  onPressed:
                  _selectedToKeep.isNotEmpty && _selectedToDelete.isNotEmpty
                      ? () => widget.onResolve(
                    _selectedToKeep.toList(),
                    _selectedToDelete.toList(),
                  )
                      : null,
                  icon: const Icon(Icons.check),
                  label: Text('keep'.t(context: context)),
                ),
                OutlinedButton.icon(
                  onPressed: () {
                    // Dismiss without action
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('select_keep_all'.t(context: context)),
                      ),
                    );
                  },
                  icon: const Icon(Icons.close),
                  label: Text('select_keep_all'.t(context: context)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DuplicateAssetCard extends StatelessWidget {
  final AssetResponseDto asset;
  final bool isSuggested;
  final bool isSelectedToKeep;
  final bool isSelectedToDelete;
  final Function(bool) onKeepToggle;
  final Function(bool) onDeleteToggle;

  const _DuplicateAssetCard({
    required this.asset,
    required this.isSuggested,
    required this.isSelectedToKeep,
    required this.isSelectedToDelete,
    required this.onKeepToggle,
    required this.onDeleteToggle,
  });

  @override
  Widget build(BuildContext context) {
    final borderColor = isSelectedToKeep
        ? Colors.green
        : isSelectedToDelete
        ? Colors.red
        : Colors.grey.withAlpha(76);

    final exifInfo = asset.exifInfo.isPresent ? asset.exifInfo.value : null;

    return Container(
      width: 300,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        border: Border.all(color: borderColor, width: 2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          // Thumbnail
          Stack(
            children: [
              Container(
                height: 200,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(10),
                    topRight: Radius.circular(10),
                  ),
                ),
                child: _AssetThumbnail(asset: asset),
              ),
              // Status chip
              Positioned(
                bottom: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: isSelectedToKeep
                        ? Colors.green.withAlpha(230)
                        : Colors.red.withAlpha(204),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isSelectedToKeep
                        ? 'keep'.t(context: context)
                        : 'to_trash'.t(context: context),
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ],
          ),
          // Metadata
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _MetadataRow(
                      label: 'file_name_text'.t(context: context),
                      value: asset.originalFileName,
                    ),
                    const SizedBox(height: 8),
                    _MetadataRow(
                      label: 'resolution'.t(context: context),
                      value: '${asset.width}x${asset.height}',
                    ),
                    const SizedBox(height: 8),
                    _MetadataRow(
                      label: 'file_size'.t(context: context),
                      value: _formatFileSize(
                        exifInfo?.fileSizeInByte.isPresent == true
                            ? exifInfo!.fileSizeInByte.value ?? 0
                            : 0,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _MetadataRow(
                      label: 'created_at'.t(context: context),
                      value: asset.fileCreatedAt.toString().split('.').first,
                    ),
                    if (exifInfo != null &&
                        exifInfo.make.isPresent &&
                        exifInfo.make.value != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: _MetadataRow(
                          label: 'make'.t(context: context),
                          value: exifInfo.make.value ?? 'N/A',
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          // Action buttons
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => onKeepToggle(!isSelectedToKeep),
                    icon: const Icon(Icons.check, size: 18),
                    label: Text(
                      'keep'.t(context: context),
                      style: const TextStyle(fontSize: 12),
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => onDeleteToggle(!isSelectedToDelete),
                    icon: const Icon(Icons.delete, size: 18),
                    label: Text(
                      'to_trash'.t(context: context),
                      style: const TextStyle(fontSize: 12),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }
}

class _AssetThumbnail extends ConsumerWidget {
  final AssetResponseDto asset;

  const _AssetThumbnail({required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final thumbnailProvider = RemoteImageProvider.thumbnail(
      assetId: asset.id,
      thumbhash: asset.thumbhash ?? '',
    );

    return OctoImage(
      fadeInDuration: const Duration(milliseconds: 0),
      fadeOutDuration: const Duration(milliseconds: 100),
      image: thumbnailProvider,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        thumbnailProvider.evict();
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.image_not_supported, size: 40),
              const SizedBox(height: 8),
              Text(
                'Failed to load image',
                style: context.textTheme.labelSmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        );
      },
      placeholderBuilder: (context) => Container(
        color: Colors.grey.shade200,
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      ),
    );
  }
}

class _MetadataRow extends StatelessWidget {
  final String label;
  final String value;

  const _MetadataRow({
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: context.textTheme.labelSmall?.copyWith(
            color: Colors.grey,
            fontSize: 10,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: context.textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.w500,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}
