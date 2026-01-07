import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/cleanup.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class FreeUpSpaceSettings extends ConsumerStatefulWidget {
  const FreeUpSpaceSettings({super.key});

  @override
  ConsumerState<FreeUpSpaceSettings> createState() => _FreeUpSpaceSettingsState();
}

class _FreeUpSpaceSettingsState extends ConsumerState<FreeUpSpaceSettings> {
  CleanupStep _currentStep = CleanupStep.selectDate;
  bool _hasScanned = false;

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
      return CleanupStep.filterOptions;
    }

    return CleanupStep.selectDate;
  }

  void _goToFiltersStep() {
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();
    setState(() => _currentStep = CleanupStep.filterOptions);
  }

  void _goToScanStep() {
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();
    setState(() => _currentStep = CleanupStep.scan);
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
    }
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
    }

    setState(() => _currentStep = CleanupStep.selectDate);
  }

  void _showAssetsPreview(List<LocalAsset> assets) {
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();
    context.pushRoute(CleanupPreviewRoute(assets: assets));
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cleanupProvider);
    final hasDate = state.selectedDate != null;
    final hasAssets = _hasScanned && state.assetsToDelete.isNotEmpty;

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
    final step2State = hasDate ? StepState.complete : StepState.disabled;
    final step3State = hasAssets
        ? StepState.complete
        : hasDate
        ? StepState.indexed
        : StepState.disabled;
    final step4State = hasAssets ? StepState.indexed : StepState.disabled;

    String getFilterSubtitle() {
      final parts = <String>[];
      switch (state.filterType) {
        case AssetFilterType.all:
          parts.add('all'.t(context: context));
        case AssetFilterType.photosOnly:
          parts.add('photos_only'.t(context: context));
        case AssetFilterType.videosOnly:
          parts.add('videos_only'.t(context: context));
      }
      if (state.keepFavorites) {
        parts.add('keep_favorites'.t(context: context));
      }
      return parts.join(' • ');
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
                child: Text(
                  'free_up_space_description'.t(context: context),
                  style: context.textTheme.labelLarge?.copyWith(fontSize: 15),
                ),
              ),
            ),

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
                      Text('cutoff_date_description'.t(context: context), style: context.textTheme.labelLarge),
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
                        onPressed: hasDate ? () => _goToFiltersStep() : null,
                        icon: const Icon(Icons.arrow_forward),
                        label: Text('continue'.t(context: context)),
                        style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                      ),
                    ],
                  ),
                  isActive: true,
                  state: step1State,
                ),

                // Step 2: Select Filter Options
                Step(
                  stepStyle: styleForState(step2State),
                  title: Text(
                    'filter_options'.t(context: context),
                    style: context.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: step2State == StepState.complete
                          ? context.colorScheme.primary
                          : step2State == StepState.disabled
                          ? context.colorScheme.onSurface.withValues(alpha: 0.38)
                          : context.colorScheme.onSurface,
                    ),
                  ),
                  subtitle: hasDate
                      ? Text(
                          getFilterSubtitle(),
                          style: context.textTheme.bodyMedium?.copyWith(
                            color: context.colorScheme.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        )
                      : null,
                  content: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('cleanup_filter_description'.t(context: context), style: context.textTheme.labelLarge),
                      const SizedBox(height: 16),
                      SegmentedButton<AssetFilterType>(
                        segments: [
                          ButtonSegment(
                            value: AssetFilterType.all,
                            label: Text('all'.t(context: context)),
                            icon: const Icon(Icons.photo_library),
                          ),
                          ButtonSegment(
                            value: AssetFilterType.photosOnly,
                            label: Text('photos'.t(context: context)),
                            icon: const Icon(Icons.photo),
                          ),
                          ButtonSegment(
                            value: AssetFilterType.videosOnly,
                            label: Text('videos'.t(context: context)),
                            icon: const Icon(Icons.videocam),
                          ),
                        ],
                        selected: {state.filterType},
                        onSelectionChanged: (selection) {
                          ref.read(cleanupProvider.notifier).setFilterType(selection.first);
                          setState(() => _hasScanned = false);
                        },
                      ),
                      const SizedBox(height: 16),
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('keep_favorites'.t(context: context), style: context.textTheme.titleSmall),
                        subtitle: Text(
                          'keep_favorites_description'.t(context: context),
                          style: context.textTheme.labelLarge,
                        ),
                        value: state.keepFavorites,
                        onChanged: (value) {
                          ref.read(cleanupProvider.notifier).setKeepFavorites(value);
                          setState(() => _hasScanned = false);
                        },
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _goToScanStep,
                        icon: const Icon(Icons.arrow_forward),
                        label: Text('continue'.t(context: context)),
                        style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 48)),
                      ),
                    ],
                  ),
                  isActive: hasDate,
                  state: step2State,
                ),

                // Step 3: Scan Assets
                Step(
                  stepStyle: styleForState(step3State),
                  title: Text(
                    'scan'.t(context: context),
                    style: context.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: step3State == StepState.complete
                          ? context.colorScheme.primary
                          : step3State == StepState.disabled
                          ? context.colorScheme.onSurface.withValues(alpha: 0.38)
                          : context.colorScheme.onSurface,
                    ),
                  ),
                  subtitle: _hasScanned
                      ? Text(
                          'cleanup_found_assets'.t(
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
                      Text(
                        'cleanup_step3_description'.t(context: context),
                        style: context.textTheme.labelLarge?.copyWith(fontSize: 15),
                      ),
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
                  state: step3State,
                ),

                // Step 4: Delete Assets
                Step(
                  stepStyle: styleForState(step4State, isDestructive: true),
                  title: Text(
                    'move_to_device_trash'.t(context: context),
                    style: context.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: step4State == StepState.disabled
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
                            ? Text(
                                'cleanup_step4_summary'.t(
                                  context: context,
                                  args: {
                                    'count': state.assetsToDelete.length.toString(),
                                    'date': DateFormat.yMMMd().format(state.selectedDate!),
                                  },
                                ),
                                style: context.textTheme.labelLarge?.copyWith(fontSize: 15),
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
                  state: step4State,
                ),
              ],
            ),
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
