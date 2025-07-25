import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
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
      ref.read(authProvider.notifier).saveAuthInfo(accessToken: accessToken).then(
            (a) => {
              log.info('Successfully updated auth info with access token: $accessToken'),
            },
            onError: (exception) => {
              log.severe(
                'Failed to update auth info with access token: $accessToken',
              ),
              ref.read(authProvider.notifier).logout(),
              context.replaceRoute(const LoginRoute()),
            },
          );
    } else {
      log.severe(
        'Missing crucial offline login info - Logging out completely',
      );
      ref.read(authProvider.notifier).logout();
      context.replaceRoute(const LoginRoute());
      return;
    }

    if (context.router.current.name == SplashScreenRoute.name) {
      context.replaceRoute(
        Store.isBetaTimelineEnabled ? const TabShellRoute() : const TabControllerRoute(),
      );
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
        child: Image(
          image: AssetImage('assets/immich-logo.png'),
          width: 80,
          filterQuality: FilterQuality.high,
        ),
      ),
    );
  }
}
