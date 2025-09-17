import 'package:auto_route/auto_route.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

class BetaTimelineListTile extends ConsumerWidget {
  const BetaTimelineListTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final betaTimelineValue = ref.watch(appSettingsServiceProvider).getSetting<bool>(AppSettingsEnum.betaTimeline);
    final serverInfo = ref.watch(serverInfoProvider);
    final auth = ref.watch(authProvider);

    if (!auth.isAuthenticated || (serverInfo.serverVersion.minor < 136 && kReleaseMode)) {
      return const SizedBox.shrink();
    }

    void onSwitchChanged(bool value) {
      showDialog(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: value ? const Text("Enable New Timeline") : const Text("Disable New Timeline"),
            content: value
                ? const Text("Are you sure you want to enable the new timeline?")
                : const Text("Are you sure you want to disable the new timeline?"),
            actions: [
              TextButton(
                onPressed: () {
                  context.pop();
                },
                child: Text(
                  "cancel".t(context: context),
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: context.colorScheme.outline),
                ),
              ),
              ElevatedButton(
                onPressed: () async {
                  Navigator.of(context).pop();
                  context.router.replaceAll([ChangeExperienceRoute(switchingToBeta: value)]);
                },
                child: Text("ok".t(context: context)),
              ),
            ],
          );
        },
      );
    }

    return Padding(
      padding: const EdgeInsets.only(left: 4.0),
      child: ListTile(
        title: Text("new_timeline".t(context: context)),
        trailing: Switch.adaptive(
          value: betaTimelineValue,
          onChanged: onSwitchChanged,
          activeThumbColor: context.primaryColor,
        ),
        onTap: () => onSwitchChanged(!betaTimelineValue),
      ),
    );
  }
}
