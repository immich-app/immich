import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/utils/isolate_lock_manager.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:logging/logging.dart';

@RoutePage()
class SplashScreenPage extends StatefulHookConsumerWidget {
  const SplashScreenPage({super.key});

  @override
  SplashScreenPageState createState() => SplashScreenPageState();
}

class SplashScreenPageState extends ConsumerState<SplashScreenPage> {
  final log = Logger("SplashScreenPage");

  @override
  void initState() {
    super.initState();
    final lockManager = ref.read(isolateLockManagerProvider(kIsolateLockManagerPort));

    lockManager.requestHolderToClose();
    lockManager
        .acquireLock()
        .timeout(const Duration(seconds: 5))
        .whenComplete(
          () => ref
              .read(authProvider.notifier)
              .setOpenApiServiceEndpoint()
              .then(logConnectionInfo)
              .whenComplete(() => resumeSession()),
        );
  }

  void logConnectionInfo(String? endpoint) {
    if (endpoint == null) {
      return;
    }

    log.info("Resuming session at $endpoint");
  }

  void resumeSession() async {
    final serverUrl = Store.tryGet(StoreKey.serverUrl);
    final endpoint = Store.tryGet(StoreKey.serverEndpoint);
    final accessToken = Store.tryGet(StoreKey.accessToken);

    if (accessToken != null && serverUrl != null && endpoint != null) {
      final infoProvider = ref.read(serverInfoProvider.notifier);
      final wsProvider = ref.read(websocketProvider.notifier);
      ref.read(authProvider.notifier).saveAuthInfo(accessToken: accessToken).then(
        (a) {
          try {
            wsProvider.connect();
            infoProvider.getServerInfo();
          } catch (e) {
            log.severe('Failed establishing connection to the server: $e');
          }
        },
        onError: (exception) => {
          log.severe('Failed to update auth info with access token: $accessToken'),
          ref.read(authProvider.notifier).logout(),
          context.replaceRoute(const LoginRoute()),
        },
      );
    } else {
      log.severe('Missing crucial offline login info - Logging out completely');
      ref.read(authProvider.notifier).logout();
      context.replaceRoute(const LoginRoute());
      return;
    }

    if (context.router.current.name == SplashScreenRoute.name) {
      context.replaceRoute(Store.isBetaTimelineEnabled ? const TabShellRoute() : const TabControllerRoute());
    }

    if (Store.isBetaTimelineEnabled) {
      return;
    }

    final hasPermission = await ref.read(galleryPermissionNotifier.notifier).hasPermission;
    if (hasPermission) {
      // Resume backup (if enable) then navigate
      ref.watch(backupProvider.notifier).resumeBackup();
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Image(image: AssetImage('assets/immich-logo.png'), width: 80, filterQuality: FilterQuality.high),
      ),
    );
  }
}
