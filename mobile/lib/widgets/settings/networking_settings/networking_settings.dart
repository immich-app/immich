import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/network.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/external_network_preference.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/local_network_preference.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

import 'package:immich_mobile/entities/store.entity.dart' as db_store;
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class NetworkingSettings extends HookConsumerWidget {
  const NetworkingSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentEndpoint =
        db_store.Store.get(db_store.StoreKey.serverEndpoint);
    final featureEnabled =
        useAppSettingsState(AppSettingsEnum.autoEndpointSwitching);

    Future<void> checkWifiReadPermission() async {
      final [hasLocationInUse, hasLocationAlways] = await Future.wait([
        ref.read(networkProvider.notifier).getWifiReadPermission(),
        ref.read(networkProvider.notifier).getWifiReadBackgroundPermission(),
      ]);

      bool? isGrantLocationAlwaysPermission;

      if (!hasLocationInUse) {
        await showDialog(
          context: context,
          builder: (context) {
            return AlertDialog(
              title: Text("location_permission".tr()),
              content: Text("location_permission_content".tr()),
              actions: [
                TextButton(
                  onPressed: () async {
                    final isGrant = await ref
                        .read(networkProvider.notifier)
                        .requestWifiReadPermission();

                    Navigator.pop(context, isGrant);
                  },
                  child: Text("grant_permission".tr()),
                ),
              ],
            );
          },
        );
      }

      if (!hasLocationAlways) {
        isGrantLocationAlwaysPermission = await showDialog(
          context: context,
          builder: (context) {
            return AlertDialog(
              title: Text("background_location_permission".tr()),
              content: Text("background_location_permission_content".tr()),
              actions: [
                TextButton(
                  onPressed: () async {
                    final isGrant = await ref
                        .read(networkProvider.notifier)
                        .requestWifiReadBackgroundPermission();

                    Navigator.pop(context, isGrant);
                  },
                  child: Text("grant_permission".tr()),
                ),
              ],
            );
          },
        );
      }

      if (isGrantLocationAlwaysPermission != null &&
          !isGrantLocationAlwaysPermission) {
        await ref.read(networkProvider.notifier).openSettings();
      }
    }

    useEffect(
      () {
        if (featureEnabled.value == true) {
          checkWifiReadPermission();
        }
        return null;
      },
      [featureEnabled.value],
    );

    return ListView(
      padding: const EdgeInsets.only(bottom: 96),
      physics: const ClampingScrollPhysics(),
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.only(top: 8, left: 16, bottom: 8),
          child: NetworkPreferenceTitle(
            title: "current_server_address".tr().toUpperCase(),
            icon: currentEndpoint.startsWith('https')
                ? Icons.https_outlined
                : Icons.http_outlined,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: const BorderRadius.all(Radius.circular(16)),
              side: BorderSide(
                color: context.colorScheme.surfaceContainerHighest,
                width: 1,
              ),
            ),
            child: ListTile(
              leading:
                  const Icon(Icons.check_circle_rounded, color: Colors.green),
              title: Text(
                currentEndpoint,
                style: TextStyle(
                  fontSize: 16,
                  fontFamily: 'Inconsolata',
                  fontWeight: FontWeight.bold,
                  color: context.primaryColor,
                ),
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 10.0),
          child: Divider(
            color: context.colorScheme.surfaceContainerHighest,
          ),
        ),
        SettingsSwitchListTile(
          enabled: true,
          valueNotifier: featureEnabled,
          title: "automatic_endpoint_switching_title".tr(),
          subtitle: "automatic_endpoint_switching_subtitle".tr(),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 8, left: 16, bottom: 16),
          child: NetworkPreferenceTitle(
            title: "local_network".tr().toUpperCase(),
            icon: Icons.home_outlined,
          ),
        ),
        LocalNetworkPreference(
          enabled: featureEnabled.value,
        ),
        Padding(
          padding: const EdgeInsets.only(top: 32, left: 16, bottom: 16),
          child: NetworkPreferenceTitle(
            title: "external_network".tr().toUpperCase(),
            icon: Icons.dns_outlined,
          ),
        ),
        ExternalNetworkPreference(
          enabled: featureEnabled.value,
        ),
      ],
    );
  }
}

class NetworkPreferenceTitle extends StatelessWidget {
  const NetworkPreferenceTitle({
    super.key,
    required this.icon,
    required this.title,
  });

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          color: context.colorScheme.onSurface.withAlpha(150),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: context.textTheme.displaySmall?.copyWith(
            color: context.colorScheme.onSurface.withAlpha(200),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class NetworkStatusIcon extends StatelessWidget {
  const NetworkStatusIcon({
    super.key,
    required this.status,
    this.enabled = true,
  }) : super();

  final AuxCheckStatus status;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: _buildIcon(context),
    );
  }

  Widget _buildIcon(BuildContext context) => switch (status) {
        AuxCheckStatus.loading => Padding(
            padding: const EdgeInsets.only(left: 4.0),
            child: SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                color: context.primaryColor,
                strokeWidth: 2,
                key: const ValueKey('loading'),
              ),
            ),
          ),
        AuxCheckStatus.valid => enabled
            ? const Icon(
                Icons.check_circle_rounded,
                color: Colors.green,
                key: ValueKey('success'),
              )
            : Icon(
                Icons.check_circle_rounded,
                color: context.colorScheme.onSurface.withAlpha(100),
                key: const ValueKey('success'),
              ),
        AuxCheckStatus.error => enabled
            ? const Icon(
                Icons.error_rounded,
                color: Colors.red,
                key: ValueKey('error'),
              )
            : const Icon(
                Icons.error_rounded,
                color: Colors.grey,
                key: ValueKey('error'),
              ),
        _ => const Icon(Icons.circle_outlined, key: ValueKey('unknown')),
      };
}
