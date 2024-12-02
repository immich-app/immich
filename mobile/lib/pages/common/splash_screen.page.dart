import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/store.entity.dart';
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

    bool isAuthSuccess = false;

    if (accessToken != null && serverUrl != null && endpoint != null) {
      try {
        isAuthSuccess = await ref.read(authProvider.notifier).saveAuthInfo(
              accessToken: accessToken,
            );
      } catch (error, stackTrace) {
        log.severe(
          'Cannot set success login info',
          error,
          stackTrace,
        );
      }
    } else {
      isAuthSuccess = false;
      log.severe(
        'Missing authentication, server, or endpoint info from the local store',
      );
    }

    if (!isAuthSuccess) {
      log.severe(
        'Unable to login using offline or online methods - Logging out completely',
      );
      ref.read(authProvider.notifier).logout();
      context.replaceRoute(const LoginRoute());
      return;
    }

    context.replaceRoute(const TabControllerRoute());

    final hasPermission =
        await ref.read(galleryPermissionNotifier.notifier).hasPermission;
    if (hasPermission) {
      // Resume backup (if enable) then navigate
      ref.watch(backupProvider.notifier).resumeBackup();
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Image(
          image: AssetImage('assets/immich-logo.png'),
          width: 80,
          filterQuality: FilterQuality.high,
        ),
      ),
    );
  }
}
