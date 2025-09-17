import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
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
    ref
        .read(authProvider.notifier)
        .setOpenApiServiceEndpoint()
        .then(logConnectionInfo)
        .whenComplete(() => resumeSession());
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
      final backgroundManager = ref.read(backgroundSyncProvider);
      final backupProvider = ref.read(driftBackupProvider.notifier);

      ref.read(authProvider.notifier).saveAuthInfo(accessToken: accessToken).then(
        (_) async {
          try {
            wsProvider.connect();
            infoProvider.getServerInfo();

            if (Store.isBetaTimelineEnabled) {
              await Future.wait([backgroundManager.syncLocal(), backgroundManager.syncRemote()]);
              await Future.wait([
                backgroundManager.hashAssets().then((_) {
                  _resumeBackup(backupProvider);
                }),
                _resumeBackup(backupProvider),
              ]);

              if (Store.get(StoreKey.syncAlbums, false)) {
                await backgroundManager.syncLinkedAlbum();
              }
            }
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

    // clean install - change the default of the flag
    // current install not using beta timeline
    if (context.router.current.name == SplashScreenRoute.name) {
      final needBetaMigration = Store.get(StoreKey.needBetaMigration, false);
      if (needBetaMigration) {
        await Store.put(StoreKey.needBetaMigration, false);
        context.router.replaceAll([ChangeExperienceRoute(switchingToBeta: true)]);
        return;
      }

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

  Future<void> _resumeBackup(DriftBackupNotifier notifier) async {
    final isEnableBackup = Store.get(StoreKey.enableBackup, false);

    if (isEnableBackup) {
      final currentUser = Store.tryGet(StoreKey.currentUser);
      if (currentUser != null) {
        notifier.handleBackupResume(currentUser.id);
      }
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
