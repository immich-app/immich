import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/auth/auxilary_endpoint.model.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/network.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/utils/url_helper.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/external_network_preference.dart';
import 'package:immich_mobile/widgets/settings/networking_settings/local_network_preference.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class NetworkingSettings extends HookConsumerWidget {
  const NetworkingSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentEndpoint = useState(getServerUrl());
    final featureEnabled = useAppSettingsState(AppSettingsEnum.autoEndpointSwitching);
    final isChangingEndpoint = useState(false);

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
                    final isGrant = await ref.read(networkProvider.notifier).requestWifiReadPermission();

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
                    final isGrant = await ref.read(networkProvider.notifier).requestWifiReadBackgroundPermission();

                    Navigator.pop(context, isGrant);
                  },
                  child: Text("grant_permission".tr()),
                ),
              ],
            );
          },
        );
      }

      if (isGrantLocationAlwaysPermission != null && !isGrantLocationAlwaysPermission) {
        await ref.read(networkProvider.notifier).openSettings();
      }
    }

    Future<void> handleChangeServerEndpoint() async {
      final controller = TextEditingController(text: currentEndpoint.value ?? '');
      
      final newUrl = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text("change_server_endpoint".tr()),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "change_server_endpoint_description".tr(),
                style: context.textTheme.bodySmall,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                autofocus: true,
                decoration: InputDecoration(
                  border: const OutlineInputBorder(),
                  hintText: "https://your-server.com",
                  labelText: "server_endpoint".tr(),
                ),
                keyboardType: TextInputType.url,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('cancel'.tr().toUpperCase(), style: const TextStyle(color: Colors.red)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, controller.text),
              child: Text('save'.tr().toUpperCase()),
            ),
          ],
        ),
      );

      if (newUrl == null || newUrl.isEmpty || newUrl == currentEndpoint.value) {
        return;
      }

      isChangingEndpoint.value = true;

      try {
        await ref.read(authProvider.notifier).changeServerEndpoint(newUrl);
        currentEndpoint.value = getServerUrl();
        
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("server_endpoint_changed_successfully".tr()),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (error) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("server_endpoint_change_failed".tr()),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        isChangingEndpoint.value = false;
      }
    }

    useEffect(() {
      if (featureEnabled.value == true) {
        checkWifiReadPermission();
      }
      return null;
    }, [featureEnabled.value]);

    return ListView(
      padding: const EdgeInsets.only(bottom: 96),
      children: <Widget>[
        const SizedBox(height: 8),
        SettingGroupTitle(
          title: "current_server_address".t(context: context),
          icon: (currentEndpoint.value?.startsWith('https') ?? false) ? Icons.https_outlined : Icons.http_outlined,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: const BorderRadius.all(Radius.circular(16)),
              side: BorderSide(color: context.colorScheme.surfaceContainerHighest, width: 1),
            ),
            child: ListTile(
              leading: isChangingEndpoint.value
                  ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: context.primaryColor,
                      ),
                    )
                  : currentEndpoint.value != null
                      ? const Icon(Icons.check_circle_rounded, color: Colors.green)
                      : const Icon(Icons.circle_outlined),
              title: Text(
                currentEndpoint.value ?? "--",
                style: TextStyle(fontSize: 14, fontFamily: 'GoogleSansCode', color: context.primaryColor),
              ),
              trailing: IconButton(
                icon: const Icon(Icons.edit_rounded),
                onPressed: isChangingEndpoint.value ? null : handleChangeServerEndpoint,
                tooltip: "change_server_endpoint".tr(),
              ),
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 10.0),
          child: Divider(color: context.colorScheme.surfaceContainerHighest),
        ),
        SettingsSwitchListTile(
          enabled: true,
          valueNotifier: featureEnabled,
          title: "automatic_endpoint_switching_title".tr(),
          subtitle: "automatic_endpoint_switching_subtitle".tr(),
        ),
        const SizedBox(height: 8),
        SettingGroupTitle(
          title: "local_network".t(context: context),
          icon: Icons.home_outlined,
        ),
        LocalNetworkPreference(enabled: featureEnabled.value),
        const SizedBox(height: 16),
        SettingGroupTitle(
          title: "external_network".t(context: context),
          icon: Icons.dns_outlined,
        ),
        ExternalNetworkPreference(enabled: featureEnabled.value),
      ],
    );
  }
}

class NetworkStatusIcon extends StatelessWidget {
  const NetworkStatusIcon({super.key, required this.status, this.enabled = true}) : super();

  final AuxCheckStatus status;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(duration: const Duration(milliseconds: 200), child: buildIcon(context));
  }

  Widget buildIcon(BuildContext context) => switch (status) {
    AuxCheckStatus.loading => Padding(
      padding: const EdgeInsets.only(left: 4.0),
      child: SizedBox(
        width: 18,
        height: 18,
        child: CircularProgressIndicator(color: context.primaryColor, strokeWidth: 2, key: const ValueKey('loading')),
      ),
    ),
    AuxCheckStatus.valid =>
      enabled
          ? const Icon(Icons.check_circle_rounded, color: Colors.green, key: ValueKey('success'))
          : Icon(
              Icons.check_circle_rounded,
              color: context.colorScheme.onSurface.withAlpha(100),
              key: const ValueKey('success'),
            ),
    AuxCheckStatus.error =>
      enabled
          ? const Icon(Icons.error_rounded, color: Colors.red, key: ValueKey('error'))
          : const Icon(Icons.error_rounded, color: Colors.grey, key: ValueKey('error')),
    _ => const Icon(Icons.circle_outlined, key: ValueKey('unknown')),
  };
}
