import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/authentication.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:logging/logging.dart';

@RoutePage()
class SplashScreenPage extends HookConsumerWidget {
  const SplashScreenPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiService = ref.watch(apiServiceProvider);
    final serverUrl = Store.tryGet(StoreKey.serverUrl);
    final endpoint = Store.tryGet(StoreKey.serverEndpoint);
    final accessToken = Store.tryGet(StoreKey.accessToken);
    final log = Logger("SplashScreenPage");

    void performLoggingIn() async {
      bool isAuthSuccess = false;

      if (accessToken != null && serverUrl != null && endpoint != null) {
        apiService.setEndpoint(endpoint);

        try {
          isAuthSuccess = await ref
              .read(authenticationProvider.notifier)
              .setSuccessLoginInfo(
                accessToken: accessToken,
                serverUrl: serverUrl,
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
        ref.read(authenticationProvider.notifier).logout();
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

    useEffect(
      () {
        performLoggingIn();
        return null;
      },
      [],
    );

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
