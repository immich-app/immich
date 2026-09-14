import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/widgets.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/locked_folder_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/mesmerizing_sliver_app_bar.dart';

@RoutePage()
class LockedFolderPage extends ConsumerStatefulWidget {
  const LockedFolderPage({super.key});

  @override
  ConsumerState<LockedFolderPage> createState() => _LockedFolderPageState();
}

class _LockedFolderPageState extends ConsumerState<LockedFolderPage> with WidgetsBindingObserver {
  bool _showOverlay = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!mounted) {
      return;
    }
    if (state == AppLifecycleState.paused) {
      unawaited(ref.read(authProvider.notifier).lockPinCode());
      unawaited(context.navigateTo(const TabShellRoute()));
      return;
    }
    setState(() {
      _showOverlay = state != AppLifecycleState.resumed;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final user = ref.watch(currentUserProvider);
          if (user == null) {
            throw Exception('User must be logged in to access locked folder');
          }

          final timelineService = ref.watch(timelineFactoryProvider).lockedFolder(user.id);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: _showOverlay
          ? const SizedBox()
          : PopScope(
              onPopInvokedWithResult: (didPop, _) => didPop ? ref.read(authProvider.notifier).lockPinCode() : null,
              child: Timeline(
                appBar: MesmerizingSliverAppBar(title: context.t.locked_folder),
                bottomSheet: const LockedFolderBottomSheet(),
              ),
            ),
    );
  }
}
