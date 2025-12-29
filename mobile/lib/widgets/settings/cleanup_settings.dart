import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/cleanup.provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class CleanupSettings extends ConsumerStatefulWidget {
  const CleanupSettings({super.key});

  @override
  ConsumerState<CleanupSettings> createState() => _CleanupSettingsState();
}

class _CleanupSettingsState extends ConsumerState<CleanupSettings> {
  int _currentStep = 0;
  bool _hasScanned = false;

  void _resetState() {
    ref.read(cleanupProvider.notifier).reset();
    _hasScanned = false;
  }

  int get _calculatedStep {
    final state = ref.read(cleanupProvider);

    if (state.assetsToDelete.isNotEmpty) {
      return 2;
    }

    if (state.selectedDate != null) {
      return 1;
    }

    return 0;
  }

  Future<void> _selectDate() async {
    final state = ref.read(cleanupProvider);
    final notifier = ref.read(cleanupProvider.notifier);
    ref.read(hapticFeedbackProvider.notifier).heavyImpact();

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: state.selectedDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      notifier.setSelectedDate(picked);
      setState(() => _currentStep = 1);
    }
  }

  Future<void> _scanAssets() async {
    final notifier = ref.read(cleanupProvider.notifier);
    ref.read(hapticFeedbackProvider.notifier).heavyImpact();

    await notifier.scanAssets();
    final state = ref.read(cleanupProvider);

    setState(() {
      _hasScanned = true;
      if (state.assetsToDelete.isNotEmpty) {
        _currentStep = 2;
      }
    });
  }

  Future<void> _deleteAssets() async {
    final state = ref.read(cleanupProvider);
    final notifier = ref.read(cleanupProvider.notifier);

    if (state.assetsToDelete.isEmpty || state.selectedDate == null) {
      return;
    }

    ref.read(hapticFeedbackProvider.notifier).heavyImpact();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) =>
          _DeleteConfirmationDialog(assetCount: state.assetsToDelete.length, cutoffDate: state.selectedDate!),
    );

    if (confirmed != true) {
      return;
    }

    final deletedCount = await notifier.deleteAssets();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('cleanup_deleted_assets'.t(context: context, args: {'count': deletedCount.toString()})),
        ),
      );
      setState(() => _currentStep = 0);
    }
  }

  String _formatDate(DateTime date) {
    return DateFormat.yMMMd().format(date);
  }

  void _showAssetsPreview(List<LocalAsset> assets) {
    ref.read(hapticFeedbackProvider.notifier).mediumImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => _CleanupAssetsPreview(assets: assets),
      ),
    );
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
    final step2State = hasAssets
        ? StepState.complete
        : hasDate
        ? StepState.indexed
        : StepState.disabled;
    final step3State = hasAssets ? StepState.indexed : StepState.disabled;

    return PopScope(
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          _resetState();
        }
      },
      child: Stepper(
        currentStep: _currentStep,
        onStepTapped: (step) {
          // Only allow going back or to completed steps
          if (step <= _calculatedStep) {
            setState(() => _currentStep = step);
          }
        },
        onStepContinue: () async {
          switch (_currentStep) {
            case 0:
              await _selectDate();
              break;
            case 1:
              await _scanAssets();
              break;
            case 2:
              await _deleteAssets();
              break;
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep -= 1);
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
                color: step1State == StepState.complete ? context.colorScheme.primary : context.colorScheme.onSurface,
              ),
            ),
            subtitle: hasDate
                ? Text(
                    _formatDate(state.selectedDate!),
                    style: context.textTheme.bodyMedium?.copyWith(
                      color: context.colorScheme.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  )
                : null,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('cleanup_description'.t(context: context), style: context.textTheme.bodyLarge),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _selectDate,
                  icon: const Icon(Icons.calendar_today),
                  label: Text(hasDate ? 'change'.t(context: context) : 'select_cutoff_date'.t(context: context)),
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
                    'cleanup_found_assets'.t(context: context, args: {'count': state.assetsToDelete.length.toString()}),
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
                Text('cleanup_step2_description'.t(context: context), style: context.textTheme.bodyLarge),
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
              'move_to_trash'.t(context: context),
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
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: context.colorScheme.errorContainer.withValues(alpha: 0.3),
                    borderRadius: const BorderRadius.all(Radius.circular(8)),
                    border: Border.all(color: context.colorScheme.error.withValues(alpha: 0.3)),
                  ),
                  child: hasAssets
                      ? Text(
                          'cleanup_step3_summary'.t(
                            context: context,
                            args: {
                              'count': state.assetsToDelete.length.toString(),
                              'date': _formatDate(state.selectedDate!),
                            },
                          ),
                          style: context.textTheme.bodyMedium,
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
                    state.isDeleting ? 'cleanup_deleting'.t(context: context) : 'move_to_trash'.t(context: context),
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
      title: Text('confirm'.t(context: context)),
      content: Text(
        'cleanup_confirm_description'.t(
          context: context,
          args: {'count': assetCount.toString(), 'date': DateFormat.yMMMd().format(cutoffDate)},
        ),
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
          child: Text('move_to_trash'.t(context: context)),
        ),
      ],
    );
  }
}

class _CleanupAssetsPreview extends StatelessWidget {
  final List<LocalAsset> assets;

  const _CleanupAssetsPreview({required this.assets});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const _DragHandle(),
        Expanded(
          child: ProviderScope(
            overrides: [
              timelineServiceProvider.overrideWith((ref) {
                final timelineService = ref
                    .watch(timelineFactoryProvider)
                    .fromAssetsWithBuckets(assets.cast<BaseAsset>(), TimelineOrigin.search);
                ref.onDispose(timelineService.dispose);
                return timelineService;
              }),
            ],
            child: const Timeline(
              appBar: null,
              bottomSheet: null,
              withScrubber: false,
              groupBy: GroupAssetsBy.day,
              readOnly: true,
            ),
          ),
        ),
      ],
    );
  }
}

class _DragHandle extends StatelessWidget {
  const _DragHandle();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: Center(
        child: SizedBox(
          width: 32,
          height: 6,
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(20)),
              color: context.colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
            ),
          ),
        ),
      ),
    );
  }
}
