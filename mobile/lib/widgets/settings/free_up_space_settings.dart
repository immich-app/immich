import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/cleanup.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

class FreeUpSpaceSettings extends ConsumerStatefulWidget {
  const FreeUpSpaceSettings({super.key});

  @override
  ConsumerState<FreeUpSpaceSettings> createState() => _FreeUpSpaceSettingsState();
}

class _FreeUpSpaceSettingsState extends ConsumerState<FreeUpSpaceSettings> {
  CleanupStep _currentStep = CleanupStep.selectDate;
  bool _hasScanned = false;
  bool _isKeepSettingsExpanded = false;

  @override
  void initState() {
    super.initState();
    WakelockPlus.enable();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeAlbumDefaults();
    });
  }

  Future<void> _initializeAlbumDefaults() async {
    final albums = await ref.read(localAlbumProvider.future);
    final existingAlbumIds = albums.map((a) => a.id).toSet();
    final albumsWithNames = albums.map((a) => (a.id, a.name)).toList();

    final notifier = ref.read(cleanupProvider.notifier);
    notifier.applyDefaultAlbumSelections(albumsWithNames);
    notifier.cleanupStaleAlbumIds(existingAlbumIds);
  }

  void _resetState() {
    ref.read(cleanupProvider.notifier).reset();
    _hasScanned = false;
  }

  CleanupStep get _calculatedStep {
    final state = ref.read(cleanupProvider);

    if (state.assetsToDelete.isNotEmpty) {
      return CleanupStep.delete;
    }

    if (state.selectedDate != null) {
      return CleanupStep.scan;
    }

    return CleanupStep.selectDate;
  }

  void _goToScanStep() {
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();
    setState(() => _currentStep = CleanupStep.scan);
    _scanAssets();
  }

  void _setPresetDate(int daysAgo) {
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();
    final date = DateTime.now().subtract(Duration(days: daysAgo));
    ref.read(cleanupProvider.notifier).setSelectedDate(date);
    setState(() => _hasScanned = false);
  }

  bool _isPresetSelected(int? daysAgo) {
    final state = ref.read(cleanupProvider);
    if (state.selectedDate == null) return false;

    final expectedDate = daysAgo != null ? DateTime.now().subtract(Duration(days: daysAgo)) : DateTime(2000);

    // Check if dates match (ignoring time component)
    return state.selectedDate!.year == expectedDate.year &&
        state.selectedDate!.month == expectedDate.month &&
        state.selectedDate!.day == expectedDate.day;
  }

  Future<void> _selectDate() async {
    final state = ref.read(cleanupProvider);
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: state.selectedDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );

    if (picked != null) {
      ref.read(cleanupProvider.notifier).setSelectedDate(picked);
      setState(() => _hasScanned = false);
    }
  }

  void _onKeepSettingsChanged() {
    setState(() {
      _hasScanned = false;
      _currentStep = CleanupStep.scan;
    });
  }

  Future<void> _scanAssets() async {
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();

    await ref.read(cleanupProvider.notifier).scanAssets();
    final state = ref.read(cleanupProvider);

    setState(() {
      _hasScanned = true;
      if (state.assetsToDelete.isNotEmpty) {
        _currentStep = CleanupStep.delete;
      }
    });
  }

  Future<void> _deleteAssets() async {
    final state = ref.read(cleanupProvider);

    if (state.assetsToDelete.isEmpty || state.selectedDate == null) {
      return;
    }

    ref.read(hapticFeedbackProvider.notifier).mediumImpact();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) =>
          _DeleteConfirmationDialog(assetCount: state.assetsToDelete.length, cutoffDate: state.selectedDate!),
    );

    if (confirmed != true) {
      return;
    }

    final deletedCount = await ref.read(cleanupProvider.notifier).deleteAssets();

    if (mounted && deletedCount > 0) {
      ref.read(hapticFeedbackProvider.notifier).heavyImpact();

      await showDialog<void>(
        context: context,
        builder: (ctx) => _DeleteSuccessDialog(deletedCount: deletedCount),
      );

      if (mounted) {
        context.router.popUntilRoot();
      }
      return;
    }

    setState(() => _currentStep = CleanupStep.selectDate);
  }

  void _showAssetsPreview(List<LocalAsset> assets) {
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();
    context.pushRoute(CleanupPreviewRoute(assets: assets));
  }

  @override
  dispose() {
    super.dispose();
    WakelockPlus.disable();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cleanupProvider);
    final hasDate = state.selectedDate != null;
    final hasAssets = _hasScanned && state.assetsToDelete.isNotEmpty;
    final subtitleStyle = context.textTheme.bodyMedium!.copyWith(
      color: context.textTheme.bodyMedium!.color!.withAlpha(215),
    );

    StepStyle styleForState(StepState stepState, {bool isDestructive = false}) {
      switch (stepState) {
        case StepState.complete:
          return StepStyle(
            color: context.colorScheme.primary,
            indexStyle: TextStyle(color: context.colorScheme.onPrimary, fontWeight: FontWeight.w500),
          );
        case StepState.disabled:
          return StepStyle(
            color: context.colorScheme.onSurface.withValues(alpha: 0.38),
            indexStyle: TextStyle(color: context.colorScheme.surface, fontWeight: FontWeight.w500),
          );
        case StepState.indexed:
        case StepState.editing:
        case StepState.error:
          if (isDestructive) {
            return StepStyle(
              color: context.colorScheme.error,
              indexStyle: TextStyle(color: context.colorScheme.onError, fontWeight: FontWeight.w500),
            );
          }
          return StepStyle(
            color: context.colorScheme.onSurface.withValues(alpha: 0.6),
            indexStyle: TextStyle(color: context.colorScheme.surface, fontWeight: FontWeight.w500),
          );
      }
    }

    final step1State = hasDate ? StepState.complete : StepState.indexed;
    final step2State = hasAssets
        ? StepState.complete
        : hasDate
        ? StepState.indexed
        : StepState.disabled;
    final step3State = hasAssets ? StepState.indexed : StepState.disabled;

    final hasKeepSettings =
        state.keepFavorites || state.keepAlbumIds.isNotEmpty || state.keepMediaType != AssetKeepType.none;

    String getKeepSettingsSummary() {
      final parts = <String>[];

      if (state.keepMediaType == AssetKeepType.photosOnly) {
        parts.add('all_photos'.t(context: context));
      } else if (state.keepMediaType == AssetKeepType.videosOnly) {
        parts.add('all_videos'.t(context: context));
      }

      if (state.keepFavorites) {
        parts.add('favorites'.t(context: context));
      }

      if (state.keepAlbumIds.isNotEmpty) {
        parts.add('keep_albums_count'.t(context: context, args: {'count': state.keepAlbumIds.length.toString()}));
      }

      if (parts.isEmpty) {
        return 'none'.t(context: context);
      }

      return parts.join(', ');
    }

    return PopScope(
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          _resetState();
        }
      },
      child: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: context.colorScheme.surfaceContainerLow,
                  borderRadius: const BorderRadius.all(Radius.circular(12)),
                  border: Border.all(color: context.primaryColor.withValues(alpha: 0.25)),
                ),
                child: Text('free_up_space_description'.t(context: context), style: context.textTheme.bodyMedium),
              ),
            ),

            // Keep on device settings card
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12.0),
              child: Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: const BorderRadius.all(Radius.circular(12)),
                  side: BorderSide(
                    color: hasKeepSettings
                        ? context.colorScheme.primary.withValues(alpha: 0.5)
                        : context.colorScheme.outlineVariant,
                    width: hasKeepSettings ? 1.5 : 1,
                  ),
                ),
                color: hasKeepSettings
                    ? context.colorScheme.primaryContainer.withValues(alpha: 0.15)
                    : context.colorScheme.surfaceContainerLow,
                child: Theme(
                  data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                  child: ExpansionTile(
                    initiallyExpanded: _isKeepSettingsExpanded,
                    onExpansionChanged: (expanded) {
                      setState(() => _isKeepSettingsExpanded = expanded);
                    },
                    leading: Icon(
                      hasKeepSettings ? Icons.bookmark : Icons.bookmark_border,
                      color: hasKeepSettings ? context.colorScheme.primary : context.colorScheme.onSurfaceVariant,
                    ),
                    title: Text(
                      'keep_on_device'.t(context: context),
                      style: context.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: hasKeepSettings ? context.colorScheme.primary : null,
                      ),
                    ),
                    subtitle: Text(
                      hasKeepSettings
                          ? 'keeping'.t(context: context, args: {'items': getKeepSettingsSummary()})
                          : 'keep_on_device_hint'.t(context: context),
                      style: context.textTheme.bodySmall?.copyWith(
                        color: hasKeepSettings ? context.colorScheme.primary : context.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text('keep_description'.t(context: context), style: subtitleStyle),
                            const SizedBox(height: 4),
                            SwitchListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                'keep_favorites'.t(context: context),
                                style: context.textTheme.bodyLarge!.copyWith(fontWeight: FontWeight.w500, height: 1.5),
                              ),

                              value: state.keepFavorites,
                              onChanged: (value) {
                                ref.read(cleanupProvider.notifier).setKeepFavorites(value);
                                _onKeepSettingsChanged();
                              },
                            ),
                            const SizedBox(height: 8),
                            _KeepAlbumsSection(
                              albumIds: state.keepAlbumIds,
                              onAlbumToggled: (albumId) {
                                ref.read(cleanupProvider.notifier).toggleKeepAlbum(albumId);
                                _onKeepSettingsChanged();
                              },
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'always_keep'.t(context: context),
                              style: context.textTheme.bodyLarge!.copyWith(fontWeight: FontWeight.w500, height: 1.5),
                            ),
                            const SizedBox(height: 4),
                            SegmentedButton<AssetKeepType>(
                              showSelectedIcon: false,
                              segments: [
                                const ButtonSegment(value: AssetKeepType.none, label: Text('—')),
                                ButtonSegment(
                                  value: AssetKeepType.photosOnly,
                                  label: Text('photos'.t(context: context)),
                                  icon: const Icon(Icons.photo),
                                ),
                                ButtonSegment(
                                  value: AssetKeepType.videosOnly,
                                  label: Text('videos'.t(context: context)),
                                  icon: const Icon(Icons.videocam),
                                ),
                              ],
                              selected: {state.keepMediaType},
                              onSelectionChanged: (selection) {
                                ref.read(cleanupProvider.notifier).setKeepMediaType(selection.first);
                                _onKeepSettingsChanged();
                              },
                            ),
                            if (state.keepMediaType != AssetKeepType.none) ...[
                              const SizedBox(height: 8),
                              Text(
                                state.keepMediaType == AssetKeepType.photosOnly
                                    ? 'always_keep_photos_hint'.t(context: context)
                                    : 'always_keep_videos_hint'.t(context: context),
                                style: context.textTheme.bodySmall?.copyWith(
                                  color: context.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),

            Stepper(
              physics: const NeverScrollableScrollPhysics(),
              currentStep: _currentStep.index,
              onStepTapped: (step) {
                // Only allow going back or to completed steps
                if (step <= _calculatedStep.index) {
                  setState(() => _currentStep = CleanupStep.values[step]);
                }
              },
              controlsBuilder: (_, __) => const SizedBox.shrink(),
              steps: [
                // Step 1: Select Cutoff Date
                Step(
                  stepStyle: styleForState(step1State),
                  title: Text(
                    'select_cutoff_date'.t(context: context),
                    style: context.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: step1State == StepState.complete
                          ? context.colorScheme.primary
                          : context.colorScheme.onSurface,
                    ),
                  ),
                  subtitle: hasDate
                      ? Text(
                          DateFormat.yMMMd().format(state.selectedDate!),
                          style: context.textTheme.bodyMedium?.copyWith(
                            color: context.colorScheme.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        )
                      : null,
                  content: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('cutoff_date_description'.t(context: context), style: subtitleStyle),
                      const SizedBox(height: 16),
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 3,
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        childAspectRatio: 1.4,
                        children: [
                          _DatePresetCard(
                            value: '30',
                            unit: 'cutoff_day'.t(context: context, args: {'count': '30'}),
                            onTap: () => _setPresetDate(30),
                            isSelected: _isPresetSelected(30),
                          ),
                          _DatePresetCard(
                            value: '60',
                            unit: 'cutoff_day'.t(context: context, args: {'count': '60'}),

                            onTap: () => _setPresetDate(60),
                            isSelected: _isPresetSelected(60),
                          ),
                          _DatePresetCard(
                            value: '90',
                            unit: 'cutoff_day'.t(context: context, args: {'count': '90'}),

                            onTap: () => _setPresetDate(90),
                            isSelected: _isPresetSelected(90),
                          ),
                          _DatePresetCard(
                            value: '1',
                            unit: 'cutoff_year'.t(context: context, args: {'count': '1'}),
                            onTap: () => _setPresetDate(365),
                            isSelected: _isPresetSelected(365),
                          ),
                          _DatePresetCard(
                            value: '2',
                            unit: 'cutoff_year'.t(context: context, args: {'count': '2'}),
                            onTap: () => _setPresetDate(730),
                            isSelected: _isPresetSelected(730),
                          ),
                          _DatePresetCard(
                            value: '3',
                            unit: 'cutoff_year'.t(context: context, args: {'count': '3'}),
                            onTap: () => _setPresetDate(1095),
                            isSelected: _isPresetSelected(1095),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: _selectDate,
                        icon: const Icon(Icons.calendar_today),
                        label: Text('custom_date'.t(context: context)),
                        style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: hasDate ? _goToScanStep : null,
                        icon: const Icon(Icons.arrow_forward),
                        label: Text('continue'.t(context: context)),
                        style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                      ),
                    ],
                  ),
                  isActive: true,
                  state: step1State,
                ),

                // Step 2: Scan Assets
                Step(
                  stepStyle: styleForState(step2State),
                  title: Text(
                    'scan'.t(context: context),
                    style: context.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: step2State == StepState.complete
                          ? context.colorScheme.primary
                          : step2State == StepState.disabled
                          ? context.colorScheme.onSurface.withValues(alpha: 0.38)
                          : context.colorScheme.onSurface,
                    ),
                  ),
                  subtitle: _hasScanned
                      ? Text(
                          state.totalBytes > 0
                              ? 'cleanup_found_assets_with_size'.t(
                                  context: context,
                                  args: {
                                    'count': state.assetsToDelete.length.toString(),
                                    'size': formatBytes(state.totalBytes),
                                  },
                                )
                              : 'cleanup_found_assets'.t(
                                  context: context,
                                  args: {'count': state.assetsToDelete.length.toString()},
                                ),
                          style: context.textTheme.bodyMedium?.copyWith(
                            color: state.assetsToDelete.isNotEmpty
                                ? context.colorScheme.primary
                                : context.colorScheme.onSurface.withValues(alpha: 0.6),
                            fontWeight: FontWeight.w500,
                          ),
                        )
                      : null,
                  content: Column(
                    children: [
                      Text('cleanup_step3_description'.t(context: context), style: subtitleStyle),
                      if (CurrentPlatform.isIOS) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: context.colorScheme.primaryContainer.withValues(alpha: 0.3),
                            borderRadius: const BorderRadius.all(Radius.circular(12)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.info_outline, color: context.colorScheme.primary),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'cleanup_icloud_shared_albums_excluded'.t(context: context),
                                  style: context.textTheme.labelLarge,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      state.isScanning
                          ? SizedBox(
                              width: 28,
                              height: 28,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                backgroundColor: context.colorScheme.primary.withAlpha(50),
                              ),
                            )
                          : ElevatedButton.icon(
                              onPressed: state.isScanning ? null : _scanAssets,
                              icon: const Icon(Icons.search),
                              label: Text(_hasScanned ? 'rescan'.t(context: context) : 'scan'.t(context: context)),
                              style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                            ),
                      if (_hasScanned && state.assetsToDelete.isEmpty) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.orange.withValues(alpha: 0.1),
                            borderRadius: const BorderRadius.all(Radius.circular(8)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info, color: Colors.orange),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'cleanup_no_assets_found'.t(context: context),
                                  style: context.textTheme.bodyMedium,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                  isActive: hasDate,
                  state: step2State,
                ),

                // Step 3: Delete Assets
                Step(
                  stepStyle: styleForState(step3State, isDestructive: true),
                  title: Text(
                    'move_to_device_trash'.t(context: context),
                    style: context.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: step3State == StepState.disabled
                          ? context.colorScheme.onSurface.withValues(alpha: 0.38)
                          : context.colorScheme.error,
                    ),
                  ),
                  content: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: context.colorScheme.errorContainer.withValues(alpha: 0.3),
                          borderRadius: const BorderRadius.all(Radius.circular(12)),
                          border: Border.all(color: context.colorScheme.error.withValues(alpha: 0.3)),
                        ),
                        child: hasAssets
                            ? Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'cleanup_step4_summary'.t(
                                      context: context,
                                      args: {
                                        'count': state.assetsToDelete.length.toString(),
                                        'date': DateFormat.yMMMd().format(state.selectedDate!),
                                      },
                                    ),
                                    style: context.textTheme.labelLarge?.copyWith(fontSize: 15),
                                  ),
                                ],
                              )
                            : null,
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: () => _showAssetsPreview(state.assetsToDelete),
                        icon: const Icon(Icons.preview),
                        label: Text('preview'.t(context: context)),
                        style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        onPressed: state.isDeleting ? null : _deleteAssets,
                        icon: state.isDeleting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.delete_forever),
                        label: Text(
                          state.isDeleting
                              ? 'cleanup_deleting'.t(context: context)
                              : 'move_to_device_trash'.t(context: context),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: context.colorScheme.error,
                          foregroundColor: context.colorScheme.onError,
                          minimumSize: const Size(double.infinity, 56),
                          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                  isActive: hasAssets,
                  state: step3State,
                ),
              ],
            ),
            const SizedBox(height: 60),
          ],
        ),
      ),
    );
  }
}

class _DeleteConfirmationDialog extends StatelessWidget {
  final int assetCount;
  final DateTime cutoffDate;

  const _DeleteConfirmationDialog({required this.assetCount, required this.cutoffDate});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('cleanup_confirm_prompt_title'.t(context: context)),
      content: Text(
        'cleanup_confirm_description'.t(
          context: context,
          args: {'count': assetCount.toString(), 'date': DateFormat.yMMMd().format(cutoffDate)},
        ),
        style: context.textTheme.labelLarge?.copyWith(fontSize: 15),
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(false),
          child: Text('cancel'.t(context: context)),
        ),
        ElevatedButton(
          onPressed: () => context.pop(true),
          style: ElevatedButton.styleFrom(
            backgroundColor: context.colorScheme.error,
            foregroundColor: context.colorScheme.onError,
          ),
          child: Text('confirm'.t(context: context)),
        ),
      ],
    );
  }
}

class _DeleteSuccessDialog extends StatelessWidget {
  final int deletedCount;

  const _DeleteSuccessDialog({required this.deletedCount});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      icon: Icon(Icons.check_circle, color: context.colorScheme.primary, size: 48),
      title: Text('success'.t(context: context)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'cleanup_deleted_assets'.t(context: context, args: {'count': deletedCount.toString()}),
            style: context.textTheme.labelLarge?.copyWith(fontSize: 16),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            'cleanup_trash_hint'.t(context: context),
            style: context.textTheme.labelLarge?.copyWith(fontSize: 16, color: context.primaryColor),
            textAlign: TextAlign.center,
          ),
        ],
      ),
      actions: [
        ElevatedButton(
          onPressed: () => context.pop(),
          child: Text('done'.t(context: context)),
        ),
      ],
    );
  }
}

class _DatePresetCard extends StatelessWidget {
  final String value;
  final String unit;
  final VoidCallback onTap;
  final bool isSelected;

  const _DatePresetCard({required this.value, required this.unit, required this.onTap, required this.isSelected});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? context.colorScheme.primaryContainer.withAlpha(100) : context.colorScheme.surfaceContainer,
      borderRadius: const BorderRadius.all(Radius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: const BorderRadius.all(Radius.circular(12)),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.all(Radius.circular(12)),
            border: Border.all(color: isSelected ? context.colorScheme.primary : Colors.transparent, width: 1),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                value,
                style: context.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isSelected ? context.colorScheme.primary : context.colorScheme.onSurface,
                ),
              ),
              Text(
                unit,
                style: context.textTheme.bodySmall?.copyWith(
                  color: isSelected
                      ? context.colorScheme.primary
                      : context.colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _KeepAlbumsSection extends ConsumerWidget {
  final Set<String> albumIds;
  final ValueChanged<String> onAlbumToggled;

  const _KeepAlbumsSection({required this.albumIds, required this.onAlbumToggled});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumsAsync = ref.watch(localAlbumProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'keep_albums'.t(context: context),
          style: context.textTheme.bodyLarge!.copyWith(fontWeight: FontWeight.w500, height: 1.5),
        ),

        const SizedBox(height: 8),
        albumsAsync.when(
          loading: () => const Center(
            child: Padding(padding: EdgeInsets.all(16.0), child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          error: (error, stack) => Text(
            'error_loading_albums'.t(context: context),
            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.error),
          ),
          data: (albums) {
            if (albums.isEmpty) {
              return Text(
                'no_albums_found'.t(context: context),
                style: context.textTheme.bodyMedium?.copyWith(
                  color: context.colorScheme.onSurface.withValues(alpha: 0.6),
                ),
              );
            }
            return Container(
              decoration: BoxDecoration(
                border: Border.all(color: context.colorScheme.outlineVariant),
                borderRadius: const BorderRadius.all(Radius.circular(12)),
              ),
              constraints: const BoxConstraints(maxHeight: 200),
              child: ClipRRect(
                borderRadius: const BorderRadius.all(Radius.circular(12)),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: albums.length,
                  itemBuilder: (context, index) {
                    final album = albums[index];
                    final isSelected = albumIds.contains(album.id);
                    return _AlbumTile(album: album, isSelected: isSelected, onToggle: () => onAlbumToggled(album.id));
                  },
                ),
              ),
            );
          },
        ),
        if (albumIds.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            'keep_albums_count'.t(context: context, args: {'count': albumIds.length.toString()}),
            style: context.textTheme.bodySmall?.copyWith(
              color: context.colorScheme.primary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }
}

class _AlbumTile extends StatelessWidget {
  final LocalAlbum album;
  final bool isSelected;
  final VoidCallback onToggle;

  const _AlbumTile({required this.album, required this.isSelected, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
      leading: Icon(
        isSelected ? Icons.check_circle : Icons.circle_outlined,
        color: isSelected ? context.colorScheme.primary : context.colorScheme.onSurfaceVariant,
        size: 20,
      ),
      title: Text(
        album.name,
        style: context.textTheme.bodyMedium?.copyWith(color: isSelected ? context.colorScheme.primary : null),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Text(
        album.assetCount.toString(),
        style: context.textTheme.bodySmall?.copyWith(color: context.colorScheme.onSurfaceVariant),
      ),
      onTap: onToggle,
    );
  }
}
