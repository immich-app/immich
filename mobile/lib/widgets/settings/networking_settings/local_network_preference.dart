import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/network.provider.dart';

class LocalNetworkPreference extends HookConsumerWidget {
  const LocalNetworkPreference({
    super.key,
    required this.enabled,
  });

  final bool enabled;

  Future<String?> _showEditDialog(
    BuildContext context,
    String title,
    String hintText,
    String initialValue,
  ) {
    final controller = TextEditingController(text: initialValue);

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            hintText: hintText,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'cancel'.tr().toUpperCase(),
              style: const TextStyle(color: Colors.red),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: Text('save'.tr().toUpperCase()),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wifiNameText = useState("");
    final localEndpointText = useState("");

    useEffect(
      () {
        final wifiName = ref.read(authProvider.notifier).getSavedWifiName();
        final localEndpoint =
            ref.read(authProvider.notifier).getSavedLocalEndpoint();

        if (wifiName != null) {
          wifiNameText.value = wifiName;
        }

        if (localEndpoint != null) {
          localEndpointText.value = localEndpoint;
        }

        return null;
      },
      [],
    );

    saveWifiName(String wifiName) {
      wifiNameText.value = wifiName;
      return ref.read(authProvider.notifier).saveWifiName(wifiName);
    }

    saveLocalEndpoint(String url) {
      localEndpointText.value = url;
      return ref.read(authProvider.notifier).saveLocalEndpoint(url);
    }

    handleEditWifiName() async {
      final wifiName = await _showEditDialog(
        context,
        "wifi_name".tr(),
        "your_wifi_name".tr(),
        wifiNameText.value,
      );

      if (wifiName != null) {
        await saveWifiName(wifiName);
      }
    }

    handleEditServerEndpoint() async {
      final localEndpoint = await _showEditDialog(
        context,
        "server_endpoint".tr(),
        "http://local-ip:2283",
        localEndpointText.value,
      );

      if (localEndpoint != null) {
        await saveLocalEndpoint(localEndpoint);
      }
    }

    autofillCurrentNetwork() async {
      final wifiName = await ref.read(networkProvider.notifier).getWifiName();

      if (wifiName == null) {
        context.showSnackBar(
          SnackBar(
            content: Text(
              "get_wifiname_error".tr(),
              style: context.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: context.colorScheme.onSecondary,
              ),
            ),
            backgroundColor: context.colorScheme.secondary,
          ),
        );
      } else {
        saveWifiName(wifiName);
      }

      final serverEndpoint =
          ref.read(authProvider.notifier).getServerEndpoint();

      if (serverEndpoint != null) {
        saveLocalEndpoint(serverEndpoint);
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Stack(
        children: [
          Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(16)),
              color: context.colorScheme.surfaceContainerLow,
              border: Border.all(
                color: context.colorScheme.surfaceContainerHighest,
                width: 1,
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  bottom: -36,
                  right: -36,
                  child: Icon(
                    Icons.home_outlined,
                    size: 120,
                    color: context.primaryColor.withValues(alpha: 0.05),
                  ),
                ),
                ListView(
                  padding: const EdgeInsets.symmetric(vertical: 16.0),
                  physics: const ClampingScrollPhysics(),
                  shrinkWrap: true,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: 4.0,
                        horizontal: 24,
                      ),
                      child: Text(
                        "local_network_sheet_info".tr(),
                        style: context.textTheme.bodyMedium,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Divider(
                      color: context.colorScheme.surfaceContainerHighest,
                    ),
                    ListTile(
                      enabled: enabled,
                      contentPadding: const EdgeInsets.only(left: 24, right: 8),
                      leading: const Icon(Icons.wifi_rounded),
                      title: Text("wifi_name".tr()),
                      subtitle: wifiNameText.value.isEmpty
                          ? Text("enter_wifi_name".tr())
                          : Text(
                              wifiNameText.value,
                              style: context.textTheme.labelLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: enabled
                                    ? context.primaryColor
                                    : context.colorScheme.onSurface
                                        .withAlpha(100),
                                fontFamily: 'Inconsolata',
                              ),
                            ),
                      trailing: IconButton(
                        onPressed: enabled ? handleEditWifiName : null,
                        icon: const Icon(Icons.edit_rounded),
                      ),
                    ),
                    ListTile(
                      enabled: enabled,
                      contentPadding: const EdgeInsets.only(left: 24, right: 8),
                      leading: const Icon(Icons.lan_rounded),
                      title: Text("server_endpoint".tr()),
                      subtitle: localEndpointText.value.isEmpty
                          ? const Text("http://local-ip:2283")
                          : Text(
                              localEndpointText.value,
                              style: context.textTheme.labelLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: enabled
                                    ? context.primaryColor
                                    : context.colorScheme.onSurface
                                        .withAlpha(100),
                                fontFamily: 'Inconsolata',
                              ),
                            ),
                      trailing: IconButton(
                        onPressed: enabled ? handleEditServerEndpoint : null,
                        icon: const Icon(Icons.edit_rounded),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24.0,
                      ),
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.wifi_find_rounded),
                          label:
                              Text('use_current_connection'.tr().toUpperCase()),
                          onPressed: enabled ? autofillCurrentNetwork : null,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
