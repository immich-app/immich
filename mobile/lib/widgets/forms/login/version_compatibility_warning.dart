import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/utils/version_compatibility.dart';
import 'package:package_info_plus/package_info_plus.dart';

class VersionCompatibilityWarning extends HookConsumerWidget {
  const VersionCompatibilityWarning({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final warningMessage = useState<String?>(null);
    final serverInfo = ref.watch(serverInfoProvider);

    checkVersionMismatch() async {
      try {
        final packageInfo = await PackageInfo.fromPlatform();
        final appVersion = packageInfo.version;
        final appMajorVersion = int.parse(appVersion.split('.')[0]);
        final appMinorVersion = int.parse(appVersion.split('.')[1]);
        final serverMajorVersion = serverInfo.serverVersion.major;
        final serverMinorVersion = serverInfo.serverVersion.minor;

        warningMessage.value = getVersionCompatibilityMessage(
          appMajorVersion,
          appMinorVersion,
          serverMajorVersion,
          serverMinorVersion,
        );
      } catch (error) {
        warningMessage.value = 'Error checking version compatibility';
      }
    }

    useEffect(
      () {
        checkVersionMismatch();
        return () {};
      },
      [],
    );

    return warningMessage.value == null
        ? const SizedBox.shrink()
        : Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.isDarkTheme
                    ? Colors.red.shade700
                    : Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: context.isDarkTheme
                      ? Colors.red.shade900
                      : Colors.red[200]!,
                ),
              ),
              child: Text(
                warningMessage.value!,
                textAlign: TextAlign.center,
              ),
            ),
          );
  }
}
