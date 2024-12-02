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

    useEffect(
      () {
        if (featureEnabled.value == true) {
          ref.read(networkProvider.notifier).getWifiReadPermission();
        }
        return null;
      },
      [featureEnabled.value],
    );

    return ListView(
      padding: const EdgeInsets.only(bottom: 96),
      physics: const ClampingScrollPhysics(),
      children: <Widget>[
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Card(
            child: ListTile(
              leading:
                  const Icon(Icons.check_circle_rounded, color: Colors.green),
              title: Text(
                "YOU ARE CONNECTING TO",
                style: context.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: Text(
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
          title: "Automatic endpoint switching",
          subtitle:
              "Switch between endpoints automatically when on or off designated Wi-Fi networks",
        ),
        const Padding(
          padding: EdgeInsets.only(top: 8, left: 16, bottom: 16),
          child: NetworkPreferenceTitle(
            title: "LOCAL NETWORK",
            icon: Icons.home_outlined,
          ),
        ),
        LocalNetworkPreference(
          enabled: featureEnabled.value,
        ),
        const Padding(
          padding: EdgeInsets.only(top: 32, left: 16, bottom: 16),
          child: NetworkPreferenceTitle(
            title: "EXTERNAL NETWORK",
            icon: Icons.dns,
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
  }) : super();

  final AuxCheckStatus status;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: _buildIcon(context),
    );
  }

  Widget _buildIcon(BuildContext context) {
    switch (status) {
      case AuxCheckStatus.loading:
        return Padding(
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
        );
      case AuxCheckStatus.valid:
        return const Icon(
          Icons.check_circle_rounded,
          color: Colors.green,
          key: ValueKey('success'),
        );
      case AuxCheckStatus.error:
        return const Icon(
          Icons.error_rounded,
          color: Colors.red,
          key: ValueKey('error'),
        );
      default:
        return const Icon(Icons.circle_outlined, key: ValueKey('unknown'));
    }
  }
}
