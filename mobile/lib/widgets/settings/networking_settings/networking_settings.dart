import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/network.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/external_network_preference.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/local_network_preference.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';

class NetworkingSettings extends HookConsumerWidget {
  const NetworkingSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentEndpoint = getServerUrl();
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
        SettingsCardLayout(
          header: SettingSectionHeader(
            title: "current_server_address".tr(),
            icon: (currentEndpoint?.startsWith('https') ?? false)
                ? Icons.https_outlined
                : Icons.http_outlined,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: currentEndpoint != null
                  ? const Icon(
                      Icons.check_circle_rounded,
                      color: Colors.green,
                    )
                  : const Icon(
                      Icons.circle_outlined,
                    ),
              title: Text(
                'server_info_box_server_url'.tr(),
                style: context.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w500,
                  color: context.colorScheme.onSurface,
                ),
              ),
              subtitle: Text(
                currentEndpoint ?? "--",
                style: context.textTheme.bodyMedium?.copyWith(
                  color: context.primaryColor,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Inconsolata',
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        SettingsCardLayout(
          header: SettingSectionHeader(
            title: "automatic_endpoint_switching_header".tr(),
            icon: Icons.swap_horizontal_circle_outlined,
          ),
          contentSpacing: 8,
          children: [
            SettingSwitchListTile(
              enabled: true,
              valueNotifier: featureEnabled,
              title: "automatic_endpoint_switching_title".tr(),
              subtitle: "automatic_endpoint_switching_subtitle".tr(),
            ),
            if (featureEnabled.value) ...[
              Divider(
                height: 1,
                color: context.colorScheme.outline.withValues(alpha: 0.2),
              ),
              const NetworkPreferenceTitle(
                icon: Icons.home_outlined,
                title: "local_network",
              ),
              LocalNetworkPreference(enabled: featureEnabled.value),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Divider(
                  height: 1,
                  color: context.colorScheme.outline.withValues(alpha: 0.2),
                ),
              ),
              // External Network Section
              const NetworkPreferenceTitle(
                title: "external_network",
                icon: Icons.dns_outlined,
              ),
              ExternalNetworkPreference(enabled: featureEnabled.value),
              const SizedBox(height: 4),
            ],
          ],
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
    return Align(
      alignment: Alignment.centerLeft,
      child: Text.rich(
        TextSpan(
          children: [
            WidgetSpan(
              child: Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Icon(icon, color: context.colorScheme.tertiary),
              ),
              alignment: PlaceholderAlignment.bottom,
            ),
            TextSpan(
              text: title.tr().toUpperCase(),
              style: context.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: context.colorScheme.tertiary,
              ),
            ),
          ],
        ),
      ),
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
            ? Icon(
                Icons.error_rounded,
                color: context.colorScheme.error,
                key: const ValueKey('error'),
              )
            : const Icon(
                Icons.error_rounded,
                color: Colors.grey,
                key: ValueKey('error'),
              ),
        _ => const Icon(Icons.circle_outlined, key: ValueKey('unknown')),
      };
}
