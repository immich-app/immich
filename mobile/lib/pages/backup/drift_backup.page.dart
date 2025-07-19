import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/backup/backup_info_card.dart';

@RoutePage()
class DriftBackupPage extends ConsumerStatefulWidget {
  const DriftBackupPage({super.key});

  @override
  ConsumerState<DriftBackupPage> createState() => _DriftBackupPageState();
}

class _DriftBackupPageState extends ConsumerState<DriftBackupPage> {
  @override
  void initState() {
    super.initState();
    ref.read(driftBackupProvider.notifier).getBackupStatus();
  }

  Future<void> startBackup() async {
    await ref.read(driftBackupProvider.notifier).getBackupStatus();
    await ref.read(driftBackupProvider.notifier).backup();
  }

  Future<void> stopBackup() async {
    await ref.read(driftBackupProvider.notifier).cancel();
  }

  @override
  Widget build(BuildContext context) {
    final selectedAlbum = ref
        .watch(backupAlbumProvider)
        .where(
          (album) => album.backupSelection == BackupSelection.selected,
        )
        .toList();

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text(
          "backup_controller_page_backup".t(),
        ),
        leading: IconButton(
          onPressed: () {
            context.maybePop(true);
          },
          splashRadius: 24,
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: IconButton(
              onPressed: () => context.pushRoute(const BackupOptionsRoute()),
              splashRadius: 24,
              icon: const Icon(
                Icons.settings_outlined,
              ),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.only(
              left: 16.0,
              right: 16,
              bottom: 32,
            ),
            child: ListView(
              children: [
                const SizedBox(height: 8),
                const _BackupAlbumSelectionCard(),
                if (selectedAlbum.isNotEmpty) ...[
                  const _TotalCard(),
                  const _BackupCard(),
                  const _RemainderCard(),
                  const Divider(),
                  _BackupToggleButton(
                    onStart: () async => await startBackup(),
                    onStop: () async => await stopBackup(),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BackupToggleButton extends ConsumerStatefulWidget {
  final VoidCallback onStart;
  final VoidCallback onStop;

  const _BackupToggleButton({
    required this.onStart,
    required this.onStop,
  });

  @override
  ConsumerState<_BackupToggleButton> createState() =>
      _BackupToggleButtonState();
}

class _BackupToggleButtonState extends ConsumerState<_BackupToggleButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _gradientAnimation;
  late Animation<double> _rotationAnimation;
  bool _isEnabled = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    );
    _gradientAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ),
    );

    _rotationAnimation = Tween<double>(begin: 0, end: 2 * math.pi).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Curves.linear,
      ),
    );

    _animationController.repeat(reverse: true);

    _isEnabled = ref
        .read(appSettingsServiceProvider)
        .getSetting(AppSettingsEnum.enableBackup);
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _onToggle(bool value) async {
    await ref
        .read(appSettingsServiceProvider)
        .setSetting(AppSettingsEnum.enableBackup, value);

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
    final enqueueCount = ref.watch(
      driftBackupProvider.select((state) => state.enqueueCount),
    );

    final enqueueTotalCount = ref.watch(
      driftBackupProvider.select((state) => state.enqueueTotalCount),
    );

    final isCanceling = ref.watch(
      driftBackupProvider.select((state) => state.isCanceling),
    );

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
              transform: GradientRotation(_rotationAnimation.value),
            ),
            boxShadow: [
              BoxShadow(
                color: context.primaryColor.withValues(alpha: 0.1),
                blurRadius: 12,
                offset: const Offset(0, 2),
              ),
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
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
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
                        child: Icon(
                          Icons.cloud_upload_outlined,
                          color: context.primaryColor,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Text(
                                  "enable_backup".t(context: context),
                                  style:
                                      context.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            if (enqueueCount > 0)
                              Text(
                                "Queuing $enqueueCount/$enqueueTotalCount",
                                style: context.textTheme.labelLarge?.copyWith(
                                  color: context.colorScheme.onSurfaceSecondary,
                                ),
                              ),
                            if (isCanceling)
                              Row(
                                children: [
                                  Text(
                                    "canceling".t(),
                                    style: context.textTheme.labelLarge,
                                  ),
                                  const SizedBox(width: 4),
                                  SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      backgroundColor: context
                                          .colorScheme.onSurface
                                          .withValues(alpha: 0.2),
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      ),
                      Switch.adaptive(
                        value: _isEnabled,
                        onChanged: (value) =>
                            isCanceling ? null : _onToggle(value),
                      ),
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

class _BackupAlbumSelectionCard extends ConsumerWidget {
  const _BackupAlbumSelectionCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget buildSelectedAlbumName() {
      String text = "backup_controller_page_backup_selected".tr();
      final albums = ref
          .watch(backupAlbumProvider)
          .where(
            (album) => album.backupSelection == BackupSelection.selected,
          )
          .toList();

      if (albums.isNotEmpty) {
        for (var album in albums) {
          if (album.name == "Recent" || album.name == "Recents") {
            text += "${album.name} (${'all'.tr()}), ";
          } else {
            text += "${album.name}, ";
          }
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: context.textTheme.labelLarge?.copyWith(
              color: context.primaryColor,
            ),
          ),
        );
      } else {
        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            "backup_controller_page_none_selected".tr(),
            style: context.textTheme.labelLarge?.copyWith(
              color: context.primaryColor,
            ),
          ),
        );
      }
    }

    Widget buildExcludedAlbumName() {
      String text = "backup_controller_page_excluded".tr();
      final albums = ref
          .watch(backupAlbumProvider)
          .where(
            (album) => album.backupSelection == BackupSelection.excluded,
          )
          .toList();

      if (albums.isNotEmpty) {
        for (var album in albums) {
          text += "${album.name}, ";
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: context.textTheme.labelLarge?.copyWith(
              color: Colors.red[300],
            ),
          ),
        );
      } else {
        return const SizedBox();
      }
    }

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        side: BorderSide(
          color: context.colorScheme.outlineVariant,
          width: 1,
        ),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: ListTile(
        minVerticalPadding: 18,
        title: Text(
          "backup_controller_page_albums",
          style: context.textTheme.titleMedium,
        ).tr(),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "backup_controller_page_to_backup",
                style: context.textTheme.bodyMedium?.copyWith(
                  color: context.colorScheme.onSurfaceSecondary,
                ),
              ).tr(),
              buildSelectedAlbumName(),
              buildExcludedAlbumName(),
            ],
          ),
        ),
        trailing: ElevatedButton(
          onPressed: () async {
            await context.pushRoute(const DriftBackupAlbumSelectionRoute());
            ref.read(driftBackupProvider.notifier).getBackupStatus();
          },
          child: const Text(
            "select",
            style: TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
      ),
    );
  }
}

class _TotalCard extends ConsumerWidget {
  const _TotalCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalCount =
        ref.watch(driftBackupProvider.select((p) => p.totalCount));

    return BackupInfoCard(
      title: "total".tr(),
      subtitle: "backup_controller_page_total_sub".tr(),
      info: totalCount.toString(),
    );
  }
}

class _BackupCard extends ConsumerWidget {
  const _BackupCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final backupCount =
        ref.watch(driftBackupProvider.select((p) => p.backupCount));

    return BackupInfoCard(
      title: "backup_controller_page_backup".tr(),
      subtitle: "backup_controller_page_backup_sub".tr(),
      info: backupCount.toString(),
    );
  }
}

class _RemainderCard extends ConsumerWidget {
  const _RemainderCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remainderCount =
        ref.watch(driftBackupProvider.select((p) => p.remainderCount));
    return BackupInfoCard(
      title: "backup_controller_page_remainder".tr(),
      subtitle: "backup_controller_page_remainder_sub".tr(),
      info: remainderCount.toString(),
    );
  }
}
