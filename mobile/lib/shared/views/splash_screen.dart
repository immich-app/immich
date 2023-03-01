import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';

class SplashScreenPage extends HookConsumerWidget {
  const SplashScreenPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiService = ref.watch(apiServiceProvider);
    HiveSavedLoginInfo? loginInfo =
        Hive.box<HiveSavedLoginInfo>(hiveLoginInfoBox).get(savedLoginInfoKey);

    void performLoggingIn() async {
      try {
        if (loginInfo != null) {
          // Resolve API server endpoint from user provided serverUrl
          await apiService.resolveAndSetEndpoint(loginInfo.serverUrl);

          var isSuccess = await ref
              .read(authenticationProvider.notifier)
              .setSuccessLoginInfo(
                accessToken: loginInfo.accessToken,
                serverUrl: loginInfo.serverUrl,
              );
          if (isSuccess) {
            final hasPermission = await ref
                .read(galleryPermissionNotifier.notifier)
                .hasPermission;
            if (hasPermission) {
              // Resume backup (if enable) then navigate
              ref.watch(backupProvider.notifier).resumeBackup();
            }
            AutoRouter.of(context).replace(const TabControllerRoute());
          } else {
            AutoRouter.of(context).replace(const LoginRoute());
          }
        }
      } catch (_) {
        AutoRouter.of(context).replace(const LoginRoute());
      }
    }

    useEffect(
      () {
        if (loginInfo != null) {
          performLoggingIn();
        } else {
          AutoRouter.of(context).replace(const LoginRoute());
        }
        return null;
      },
      [],
    );

    return const Scaffold(
      body: Center(
        child: Image(
          image: AssetImage('assets/immich-logo-no-outline.png'),
          width: 80,
          filterQuality: FilterQuality.high,
        ),
      ),
    );
  }
}
