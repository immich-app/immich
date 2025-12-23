import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

class BackupToggleButton extends ConsumerStatefulWidget {
  final VoidCallback onStart;
  final VoidCallback onStop;

  const BackupToggleButton({super.key, required this.onStart, required this.onStop});

  @override
  ConsumerState<BackupToggleButton> createState() => BackupToggleButtonState();
}

class BackupToggleButtonState extends ConsumerState<BackupToggleButton> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _gradientAnimation;
  bool _isEnabled = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(duration: const Duration(seconds: 8), vsync: this);

    _gradientAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeInOut));

    _isEnabled = ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _onToggle(bool value) async {
    await ref.read(appSettingsServiceProvider).setSetting(AppSettingsEnum.enableBackup, value);

    setState(() {
      _isEnabled = value;
    });

    if (value) {
      widget.onStart.call();
    } else {
      widget.onStop.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final enqueueCount = ref.watch(driftBackupProvider.select((state) => state.enqueueCount));

    final enqueueTotalCount = ref.watch(driftBackupProvider.select((state) => state.enqueueTotalCount));

    final isCanceling = ref.watch(driftBackupProvider.select((state) => state.isCanceling));

    final uploadTasks = ref.watch(driftBackupProvider.select((state) => state.uploadItems));

    final isSyncing = ref.watch(driftBackupProvider.select((state) => state.isSyncing));

    final isProcessing = uploadTasks.isNotEmpty || isSyncing;

    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        final gradientColors = [
          Color.lerp(
            context.primaryColor.withValues(alpha: 0.5),
            context.primaryColor.withValues(alpha: 0.3),
            _gradientAnimation.value,
          )!,
          Color.lerp(
            context.primaryColor.withValues(alpha: 0.2),
            context.primaryColor.withValues(alpha: 0.4),
            _gradientAnimation.value,
          )!,
          Color.lerp(
            context.primaryColor.withValues(alpha: 0.3),
            context.primaryColor.withValues(alpha: 0.5),
            _gradientAnimation.value,
          )!,
        ];

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.all(Radius.circular(20)),
            gradient: LinearGradient(
              colors: gradientColors,
              stops: const [0.0, 0.5, 1.0],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(color: context.primaryColor.withValues(alpha: 0.1), blurRadius: 12, offset: const Offset(0, 2)),
            ],
          ),
          child: Container(
            margin: const EdgeInsets.all(1.5),
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(18.5)),
              color: context.colorScheme.surfaceContainerLow,
            ),
            child: Material(
              color: context.colorScheme.surfaceContainerLow,
              borderRadius: const BorderRadius.all(Radius.circular(20.5)),
              child: InkWell(
                borderRadius: const BorderRadius.all(Radius.circular(20.5)),
                onTap: () => isCanceling ? null : _onToggle(!_isEnabled),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [
                              context.primaryColor.withValues(alpha: 0.2),
                              context.primaryColor.withValues(alpha: 0.1),
                            ],
                          ),
                        ),
                        child: isProcessing
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))
                            : Icon(Icons.cloud_upload_outlined, color: context.primaryColor, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Flexible(
                                  child: Text(
                                    "enable_backup".t(context: context),
                                    style: context.textTheme.titleMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                      color: context.primaryColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (enqueueCount != enqueueTotalCount)
                              Text(
                                "queue_status".t(
                                  context: context,
                                  args: {'count': enqueueCount.toString(), 'total': enqueueTotalCount.toString()},
                                ),
                                style: context.textTheme.labelLarge?.copyWith(
                                  color: context.colorScheme.onSurfaceSecondary,
                                ),
                              ),
                            if (isCanceling)
                              Row(
                                children: [
                                  Text("canceling".t(), style: context.textTheme.labelLarge),
                                  const SizedBox(width: 4),
                                  SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      backgroundColor: context.colorScheme.onSurface.withValues(alpha: 0.2),
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ),
                      Switch.adaptive(value: _isEnabled, onChanged: (value) => isCanceling ? null : _onToggle(value)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
