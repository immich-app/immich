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
import 'package:openapi/api.dart';

@RoutePage()
class SplashScreenPage extends HookConsumerWidget {
  const SplashScreenPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiService = ref.watch(apiServiceProvider);
    final serverUrl = Store.tryGet(StoreKey.serverUrl);
    final accessToken = Store.tryGet(StoreKey.accessToken);
    final log = Logger("SplashScreenPage");

    void performLoggingIn() async {
      bool isSuccess = false;
      bool deviceIsOffline = false;

      if (accessToken != null && serverUrl != null) {
        try {
          // Resolve API server endpoint from user provided serverUrl
          await apiService.resolveAndSetEndpoint(serverUrl);
        } on ApiException catch (error, stackTrace) {
          log.severe(
            "Failed to resolve endpoint [ApiException]",
            error,
            stackTrace,
          );
          // okay, try to continue anyway if offline
          if (error.code == 503) {
            deviceIsOffline = true;
            log.warning("Device seems to be offline upon launch");
          } else {
            log.severe("Failed to resolve endpoint", error);
          }
        } catch (error, stackTrace) {
          log.severe(
            "Failed to resolve endpoint [Catch All]",
            error,
            stackTrace,
          );
        }

        try {
          isSuccess = await ref
              .read(authenticationProvider.notifier)
              .setSuccessLoginInfo(
                accessToken: accessToken,
                serverUrl: serverUrl,
                offlineLogin: deviceIsOffline,
              );
        } catch (error, stackTrace) {
          log.severe(
            'Cannot set success login info',
            error,
            stackTrace,
          );
        }
      }

      // If the device is offline and there is a currentUser stored locallly
      // Proceed into the app
      if (deviceIsOffline && Store.tryGet(StoreKey.currentUser) != null) {
        context.replaceRoute(const TabControllerRoute());
      } else if (isSuccess) {
        // If device was able to login through the internet successfully
        final hasPermission =
            await ref.read(galleryPermissionNotifier.notifier).hasPermission;
        if (hasPermission) {
          // Resume backup (if enable) then navigate
          ref.watch(backupProvider.notifier).resumeBackup();
        }
        context.replaceRoute(const TabControllerRoute());
      } else {
        log.severe(
          'Unable to login through offline or online methods - logging out completely',
        );

        ref.read(authenticationProvider.notifier).logout();
        // User was unable to login through either offline or online methods
        context.replaceRoute(const LoginRoute());
      }
    }

    useEffect(
      () {
        if (serverUrl != null && accessToken != null) {
          performLoggingIn();
        } else {
          context.replaceRoute(const LoginRoute());
        }
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
