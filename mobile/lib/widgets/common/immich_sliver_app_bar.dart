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
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
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

    return SliverAnimatedOpacity(
      duration: Durations.medium1,
      opacity: isMultiSelectEnabled ? 0 : 1,
      sliver: SliverAppBar(
        floating: floating,
        pinned: pinned,
        snap: snap,
        expandedHeight: expandedHeight,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(5))),
        automaticallyImplyLeading: false,
        centerTitle: false,
        title: title ?? const _ImmichLogoWithText(),
        actions: [
          if (isCasting && !isReadonlyModeEnabled)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: IconButton(
                onPressed: () {
                  showDialog(context: context, builder: (context) => const CastDialog());
                },
                icon: Icon(isCasting ? Icons.cast_connected_rounded : Icons.cast_rounded),
              ),
            ),
          const _SyncStatusIndicator(),
          if (actions != null)
            ...actions!.map((action) => Padding(padding: const EdgeInsets.only(right: 16), child: action)),
          if ((kDebugMode || kProfileMode) && !isReadonlyModeEnabled)
            IconButton(
              icon: const Icon(Icons.science_rounded),
              onPressed: () => context.pushRoute(const FeatInDevRoute()),
            ),
          if (showUploadButton && !isReadonlyModeEnabled)
            const Padding(padding: EdgeInsets.only(right: 20), child: _BackupIndicator()),
          const Padding(padding: EdgeInsets.only(right: 20), child: _ProfileIndicator()),
        ],
      ),
    );
  }
}

class _ImmichLogoWithText extends StatelessWidget {
  const _ImmichLogoWithText();

  @override
  Widget build(BuildContext context) {
    return Builder(
      builder: (BuildContext context) {
        return Row(
          children: [
            Builder(
              builder: (context) {
                return Badge(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  backgroundColor: context.primaryColor,
                  alignment: Alignment.centerRight,
                  offset: const Offset(16, -8),
                  label: Text(
                    'β',
                    style: TextStyle(
                      fontSize: 11,
                      color: context.colorScheme.onPrimary,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'OverpassMono',
                      height: 1.2,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.only(top: 3.0),
                    child: SvgPicture.asset(
                      context.isDarkTheme
                          ? 'assets/immich-logo-inline-dark.svg'
                          : 'assets/immich-logo-inline-light.svg',
                      height: 40,
                    ),
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }
}

class _ProfileIndicator extends ConsumerWidget {
  const _ProfileIndicator();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ServerInfo serverInfoState = ref.watch(serverInfoProvider);
    final user = ref.watch(currentUserProvider);
    const widgetSize = 30.0;

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

    return InkWell(
      onTap: () => showDialog(context: context, useRootNavigator: false, builder: (ctx) => const ImmichAppBarDialog()),
      onLongPress: () => toggleReadonlyMode(),
      borderRadius: const BorderRadius.all(Radius.circular(12)),
      child: Badge(
        label: Container(
          decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(widgetSize / 2)),
          child: const Icon(Icons.info, color: Color.fromARGB(255, 243, 188, 106), size: widgetSize / 2),
        ),
        backgroundColor: Colors.transparent,
        alignment: Alignment.bottomRight,
        isLabelVisible:
            serverInfoState.isVersionMismatch || ((user?.isAdmin ?? false) && serverInfoState.isNewReleaseAvailable),
        offset: const Offset(-2, -12),
        child: user == null
            ? const Icon(Icons.face_outlined, size: widgetSize)
            : Semantics(
                label: "logged_in_as".tr(namedArgs: {"user": user.name}),
                child: AbsorbPointer(child: UserCircleAvatar(radius: 17, size: 31, user: user)),
              ),
      ),
    );
  }
}

class _BackupIndicator extends ConsumerWidget {
  const _BackupIndicator();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const widgetSize = 30.0;
    final indicatorIcon = _getBackupBadgeIcon(context, ref);
    final badgeBackground = context.colorScheme.surfaceContainer;

    return InkWell(
      onTap: () => context.pushRoute(const DriftBackupRoute()),
      borderRadius: const BorderRadius.all(Radius.circular(12)),
      child: Badge(
        label: Container(
          width: widgetSize / 2,
          height: widgetSize / 2,
          decoration: BoxDecoration(
            color: badgeBackground,
            border: Border.all(color: context.colorScheme.outline.withValues(alpha: .3)),
            borderRadius: BorderRadius.circular(widgetSize / 2),
          ),
          child: indicatorIcon,
        ),
        backgroundColor: Colors.transparent,
        alignment: Alignment.bottomRight,
        isLabelVisible: indicatorIcon != null,
        offset: const Offset(-2, -12),
        child: Icon(Icons.backup_rounded, size: widgetSize, color: context.primaryColor),
      ),
    );
  }

  Widget? _getBackupBadgeIcon(BuildContext context, WidgetRef ref) {
    final backupStateStream = ref.watch(settingsProvider).watch(Setting.enableBackup);
    final isDarkTheme = context.isDarkTheme;
    final iconColor = isDarkTheme ? Colors.white : Colors.black;
    final isUploading = ref.watch(driftBackupProvider.select((state) => state.uploadItems.isNotEmpty));

    return StreamBuilder(
      stream: backupStateStream,
      initialData: false,
      builder: (ctx, snapshot) {
        final backupEnabled = snapshot.data ?? false;

        if (!backupEnabled) {
          return Icon(
            Icons.cloud_off_rounded,
            size: 9,
            color: iconColor,
            semanticLabel: 'backup_controller_page_backup'.tr(),
          );
        }

        if (isUploading) {
          return Container(
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
          );
        }

        return Icon(
          Icons.check_outlined,
          size: 9,
          color: iconColor,
          semanticLabel: 'backup_controller_page_backup'.tr(),
        );
      },
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

    return AnimatedBuilder(
      animation: Listenable.merge([_rotationAnimation, _dismissalAnimation]),
      builder: (context, child) {
        return Padding(
          padding: EdgeInsets.only(right: isSyncing ? 16 : 0),
          child: Transform.scale(
            scale: isSyncing ? 1.0 : _dismissalAnimation.value,
            child: Opacity(
              opacity: isSyncing ? 1.0 : _dismissalAnimation.value,
              child: Transform.rotate(
                angle: _rotationAnimation.value * 2 * 3.14159 * -1, // Rotate counter-clockwise
                child: Icon(Icons.sync, size: 24, color: context.primaryColor),
              ),
            ),
          ),
        );
      },
    );
  }
}
