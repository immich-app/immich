import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/server_info/server_info.model.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/asset_viewer/cast_dialog.dart';
import 'package:immich_mobile/widgets/common/app_bar_dialog/app_bar_dialog.dart';
import 'package:immich_mobile/widgets/common/user_circle_avatar.dart';

class ImmichSliverAppBar extends ConsumerWidget {
  final List<Widget>? actions;
  final bool showUploadButton;
  final bool floating;
  final bool pinned;
  final bool snap;
  final Widget? title;
  final double? expandedHeight;

  const ImmichSliverAppBar({
    super.key,
    this.actions,
    this.showUploadButton = true,
    this.floating = true,
    this.pinned = false,
    this.snap = true,
    this.title,
    this.expandedHeight,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCasting = ref.watch(castProvider.select((c) => c.isCasting));
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);
    final isMultiSelectEnabled = ref.watch(multiSelectProvider.select((s) => s.isEnabled));

    return SliverIgnorePointer(
      ignoring: isMultiSelectEnabled,
      sliver: SliverAnimatedOpacity(
        duration: Durations.medium1,
        opacity: isMultiSelectEnabled ? 0 : 1,
        sliver: SliverAppBar(
          backgroundColor: context.colorScheme.surface,
          surfaceTintColor: context.colorScheme.surfaceTint,
          elevation: 0,
          scrolledUnderElevation: 1.0,
          floating: floating,
          pinned: pinned,
          snap: snap,
          expandedHeight: expandedHeight,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(bottom: Radius.circular(5))),
          automaticallyImplyLeading: false,
          centerTitle: false,
          title: title ?? const _ImmichLogoWithText(),
          actions: [
            const _SyncStatusIndicator(),
            if (isCasting && !isReadonlyModeEnabled)
              IconButton(
                onPressed: () => showDialog(context: context, builder: (context) => const CastDialog()),
                icon: Icon(isCasting ? Icons.cast_connected_rounded : Icons.cast_rounded),
              ),
            if (actions != null) ...actions!,
            if (showUploadButton && !isReadonlyModeEnabled) const _BackupIndicator(),
            const _ProfileIndicator(),
            const SizedBox(width: 8),
          ],
        ),
      ),
    );
  }
}

class _ImmichLogoWithText extends StatelessWidget {
  const _ImmichLogoWithText();

  @override
  Widget build(BuildContext context) => AnimatedOpacity(
    opacity: IconTheme.of(context).opacity ?? 1,
    duration: kThemeChangeDuration,
    child: SvgPicture.asset(
      context.isDarkTheme ? 'assets/immich-logo-inline-dark.svg' : 'assets/immich-logo-inline-light.svg',
      height: 40,
    ),
  );
}

class _ProfileIndicator extends ConsumerWidget {
  const _ProfileIndicator();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final bool versionWarningPresent = ref.watch(versionWarningPresentProvider(user));
    final serverInfoState = ref.watch(serverInfoProvider);

    const widgetSize = 32.0;

    // TODO: remove this when update Flutter version newer than 3.35.7
    final isIpad = defaultTargetPlatform == TargetPlatform.iOS && !context.isMobile;

    void toggleReadonlyMode() {
      final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);
      ref.read(readonlyModeProvider.notifier).toggleReadonlyMode();

      context.scaffoldMessenger.showSnackBar(
        SnackBar(
          duration: const Duration(seconds: 2),
          content: Text(
            (isReadonlyModeEnabled ? "readonly_mode_disabled" : "readonly_mode_enabled").tr(),
            style: context.textTheme.bodyLarge?.copyWith(color: context.primaryColor),
          ),
        ),
      );
    }

    return IconButton(
      onPressed: () => showDialog(
        context: context,
        useRootNavigator: false,
        barrierDismissible: !isIpad,
        builder: (ctx) => const ImmichAppBarDialog(),
      ),
      onLongPress: () => toggleReadonlyMode(),
      icon: Badge(
        label: _BadgeLabel(
          Icon(
            Icons.info,
            color: serverInfoState.versionStatus == VersionStatus.error
                ? context.colorScheme.error
                : context.primaryColor,
            size: widgetSize / 2,
            semanticLabel: 'new_version_available'.tr(),
          ),
        ),
        backgroundColor: Colors.transparent,
        alignment: Alignment.bottomRight,
        isLabelVisible: versionWarningPresent,
        offset: const Offset(-2, -12),
        child: user == null
            ? const Icon(Icons.face_outlined, size: widgetSize)
            : Semantics(
                label: "logged_in_as".tr(namedArgs: {"user": user.name}),
                child: AbsorbPointer(
                  child: Builder(
                    builder: (context) => UserCircleAvatar(
                      size: 34,
                      user: user,
                      opacity: IconTheme.of(context).opacity ?? 1,
                      hasBorder: true,
                    ),
                  ),
                ),
              ),
      ),
    );
  }
}

const double _kBadgeWidgetSize = 30.0;

class _BackupIndicator extends ConsumerWidget {
  const _BackupIndicator();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final indicatorIcon = _getBackupBadgeIcon(context, ref);

    return IconButton(
      onPressed: () => context.pushRoute(const DriftBackupRoute()),
      icon: Badge(
        label: indicatorIcon,
        backgroundColor: Colors.transparent,
        alignment: Alignment.bottomRight,
        isLabelVisible: indicatorIcon != null,
        offset: const Offset(-2, -12),
        child: Icon(Icons.backup_rounded, size: _kBadgeWidgetSize, color: context.primaryColor),
      ),
    );
  }

  Widget? _getBackupBadgeIcon(BuildContext context, WidgetRef ref) {
    final backupStateStream = ref.watch(settingsProvider).watch(Setting.enableBackup);
    final hasError = ref.watch(driftBackupProvider.select((state) => state.error != BackupError.none));
    final isDarkTheme = context.isDarkTheme;
    final iconColor = isDarkTheme ? Colors.white : Colors.black;
    final isUploading = ref.watch(driftBackupProvider.select((state) => state.uploadItems.isNotEmpty));

    return StreamBuilder(
      stream: backupStateStream,
      initialData: false,
      builder: (ctx, snapshot) {
        final backupEnabled = snapshot.data ?? false;

        if (!backupEnabled) {
          return _BadgeLabel(
            Icon(
              Icons.cloud_off_rounded,
              size: 9,
              color: iconColor,
              semanticLabel: 'backup_controller_page_backup'.tr(),
            ),
          );
        }

        if (hasError) {
          return _BadgeLabel(
            Icon(
              Icons.warning_rounded,
              size: 12,
              color: context.colorScheme.error,
              semanticLabel: 'backup_controller_page_backup'.tr(),
            ),
            backgroundColor: context.colorScheme.errorContainer,
          );
        }

        if (isUploading) {
          return _BadgeLabel(
            Container(
              padding: const EdgeInsets.all(3.5),
              child: Theme(
                data: context.themeData.copyWith(
                  progressIndicatorTheme: context.themeData.progressIndicatorTheme.copyWith(year2023: true),
                ),
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  strokeCap: StrokeCap.round,
                  valueColor: AlwaysStoppedAnimation<Color>(iconColor),
                  semanticsLabel: 'backup_controller_page_backup'.tr(),
                ),
              ),
            ),
          );
        }

        return _BadgeLabel(
          Icon(Icons.check_outlined, size: 9, color: iconColor, semanticLabel: 'backup_controller_page_backup'.tr()),
        );
      },
    );
  }
}

class _BadgeLabel extends StatelessWidget {
  final Widget indicator;
  final Color? backgroundColor;

  const _BadgeLabel(this.indicator, {this.backgroundColor});

  @override
  Widget build(BuildContext context) {
    final opacity = IconTheme.of(context).opacity ?? 1;

    return Container(
      width: _kBadgeWidgetSize / 2,
      height: _kBadgeWidgetSize / 2,
      decoration: BoxDecoration(
        color: (backgroundColor ?? context.colorScheme.surfaceContainer).withValues(alpha: opacity),
        border: Border.all(color: context.colorScheme.outline.withValues(alpha: .3 * opacity)),
        borderRadius: BorderRadius.circular(_kBadgeWidgetSize / 2),
      ),
      child: indicator,
    );
  }
}

class _SyncStatusIndicator extends ConsumerStatefulWidget {
  const _SyncStatusIndicator();

  @override
  ConsumerState<_SyncStatusIndicator> createState() => _SyncStatusIndicatorState();
}

class _SyncStatusIndicatorState extends ConsumerState<_SyncStatusIndicator> with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _dismissalController;
  late Animation<double> _rotationAnimation;
  late Animation<double> _dismissalAnimation;

  @override
  void initState() {
    super.initState();
    _rotationController = AnimationController(duration: const Duration(seconds: 2), vsync: this);
    _dismissalController = AnimationController(duration: const Duration(milliseconds: 300), vsync: this);
    _rotationAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(_rotationController);
    _dismissalAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _dismissalController, curve: Curves.easeOutQuart));
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _dismissalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final syncStatus = ref.watch(syncStatusProvider);
    final isSyncing = syncStatus.isRemoteSyncing || syncStatus.isLocalSyncing;

    // Control animations based on sync status
    if (isSyncing) {
      if (!_rotationController.isAnimating) {
        _rotationController.repeat();
      }
      _dismissalController.reset();
    } else {
      _rotationController.stop();
      if (_dismissalController.status == AnimationStatus.dismissed) {
        _dismissalController.forward();
      }
    }

    // Don't show anything if not syncing and dismissal animation is complete
    if (!isSyncing && _dismissalController.status == AnimationStatus.completed) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.all(8),
      child: TweenAnimationBuilder<double>(
        tween: Tween(end: IconTheme.of(context).opacity ?? 1),
        duration: kThemeChangeDuration,
        builder: (context, opacity, child) {
          return AnimatedBuilder(
            animation: Listenable.merge([_rotationAnimation, _dismissalAnimation]),
            builder: (context, child) {
              final dismissalValue = isSyncing ? 1.0 : _dismissalAnimation.value;
              return IconTheme(
                data: IconTheme.of(context).copyWith(opacity: opacity * dismissalValue),
                child: Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..scaleByDouble(dismissalValue, dismissalValue, dismissalValue, 1.0)
                    ..rotateZ(-_rotationAnimation.value * 2 * math.pi),
                  child: const Icon(Icons.sync),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
