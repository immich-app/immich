import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/pages/onboarding/backup_step.widget.dart';
import 'package:immich_mobile/pages/onboarding/done_step.widget.dart';
import 'package:immich_mobile/pages/onboarding/notification_step.widget.dart';
import 'package:immich_mobile/pages/onboarding/photo_step.widget.dart';
import 'package:immich_mobile/pages/onboarding/step_indicator.widget.dart';
import 'package:immich_mobile/pages/onboarding/theme_step.widget.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/feature_message.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:logging/logging.dart';
import 'package:permission_handler/permission_handler.dart';

enum _Step {
  photo,
  backup(needsGallery: true),
  notification(needsGallery: true),
  theme,
  done;

  const _Step({this.needsGallery = false});

  final bool needsGallery;
}

@RoutePage()
class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});

  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage> {
  final _log = Logger('OnboardingPage');
  final _controller = PageController();
  int _page = 0;
  Future<void>? _prepareAlbumsTask;
  late final AppLifecycleListener _lifecycleListener;

  @override
  void initState() {
    super.initState();
    _refreshPermissions();
    _lifecycleListener = AppLifecycleListener(onResume: _refreshPermissions);
  }

  @override
  void dispose() {
    _lifecycleListener.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _refreshPermissions() {
    unawaited(ref.read(galleryPermissionNotifier.notifier).getGalleryPermissionStatus());
    unawaited(ref.read(notificationPermissionProvider.notifier).getNotificationPermission());
  }

  bool get _hasGalleryAccess {
    final status = ref.read(galleryPermissionNotifier);
    return status.isGranted || status.isLimited;
  }

  bool _applies(_Step step) => !step.needsGallery || _hasGalleryAccess;

  void _next() => _move(1);

  void _previous() => _move(-1);

  void _move(int direction) {
    for (var i = _page + direction; i >= 0 && i < _Step.values.length; i += direction) {
      final step = _Step.values[i];
      if (_applies(step)) {
        _goTo(step);
        return;
      }
    }
  }

  void _goTo(_Step step) {
    if ((step.index - _page).abs() > 1) {
      _controller.jumpToPage(step.index);
      return;
    }

    _controller.animateToPage(step.index, duration: ImmichDuration.moderate, curve: Curves.easeInOut);
  }

  Future<void> _finish() async {
    await ref.read(onboardingServiceProvider).markComplete();
    if (mounted) {
      await context.router.replaceAll([const TabShellRoute()]);
    }
  }

  void _leavePhotoStep() {
    if (_hasGalleryAccess) {
      _prepareAlbumsTask ??= _prepareLocalAlbums();
    }
    _next();
  }

  Future<void> _prepareLocalAlbums() async {
    try {
      final sync = ref.read(backgroundSyncProvider);
      await sync.syncLocal(full: true);
      await ref.read(backupAlbumProvider.notifier).getAll();
      if (!mounted) {
        return;
      }

      await _preselectCameraRoll();
    } catch (error, stack) {
      _log.severe('Failed to prepare local albums for backup', error, stack);
    }
  }

  Future<void> _preselectCameraRoll() async {
    final albums = ref.read(backupAlbumProvider);
    if (albums.any((album) => album.backupSelection != .none)) {
      return;
    }

    final cameraRoll = albums.firstWhereOrNull(_isCameraRoll);
    if (cameraRoll == null) {
      _log.warning('No camera roll album found, leaving backup selection empty');
      return;
    }

    await ref.read(backupAlbumProvider.notifier).selectAlbum(cameraRoll);
  }

  bool _isCameraRoll(LocalAlbum album) =>
      CurrentPlatform.isIOS ? (album.name == 'Recents' || album.name == 'Recent') : album.name == 'Camera';

  Widget _buildStep(_Step step) => switch (step) {
    .photo => OnboardingPhotoStep(onNext: _leavePhotoStep),
    .backup => OnboardingBackupStep(onNext: _next),
    .notification => OnboardingNotificationStep(onNext: _next),
    .theme => OnboardingThemeStep(onNext: _next),
    .done => OnboardingDoneStep(onFinish: _finish),
  };

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          leading: _page == _Step.photo.index ? null : BackButton(onPressed: _previous),
          centerTitle: true,
          title: OnboardingStepIndicator(step: _page, stepCount: _Step.values.length),
          actions: [
            if (_page != _Step.done.index)
              ImmichTextButton(labelText: context.t.skip, onPressed: _finish, variant: .ghost, expanded: false),
          ],
        ),
        body: SafeArea(
          child: PageView.builder(
            controller: _controller,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _Step.values.length,
            onPageChanged: (index) => setState(() => _page = index),
            itemBuilder: (_, index) => _buildStep(_Step.values[index]),
          ),
        ),
      ),
    );
  }
}
