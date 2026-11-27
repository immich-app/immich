import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/network.provider.dart';
import 'package:immich_ui/immich_ui.dart';

class LocalNetworkPreference extends HookConsumerWidget {
  const LocalNetworkPreference({super.key, required this.enabled});

  final bool enabled;

  Future<String?> _showEditDialog(
    BuildContext context,
    String title,
    String hintText,
    String initialValue, {
    bool isUrlField = false,
  }) {
    final controller = TextEditingController(text: initialValue);

    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: isUrlField
            ? ImmichURLInput(controller: controller, autofocus: true, keyboardAction: .done, hintText: hintText)
            : ImmichTextInput(controller: controller, autofocus: true, keyboardAction: .done, hintText: hintText),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.t.cancel.toUpperCase(), style: const TextStyle(color: Colors.red)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: Text(context.t.save.toUpperCase()),
          ),
        ],
      ),
    );
  }

  //returns the Wi-Fi name and custom endpoint (empty to use the default endpoint)
  Future<(String, String)?> _showWifiNetworkDialog(BuildContext context, {String wifiName = '', String endpoint = ''}) {
    final wifiNameController = TextEditingController(text: wifiName);
    final endpointController = TextEditingController(text: endpoint);

    return showDialog<(String, String)>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.t.wifi_name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ImmichTextInput(
              controller: wifiNameController,
              autofocus: wifiName.isEmpty,
              keyboardAction: .next,
              label: context.t.wifi_name,
              hintText: context.t.your_wifi_name,
            ),
            const SizedBox(height: 16),
            ImmichURLInput(
              controller: endpointController,
              keyboardAction: .done,
              label: context.t.custom_endpoint,
              hintText: context.t.custom_endpoint_hint,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.t.cancel.toUpperCase(), style: const TextStyle(color: Colors.red)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, (wifiNameController.text.trim(), endpointController.text.trim())),
            child: Text(context.t.save.toUpperCase()),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wifiNetworks = useState<Map<String, String>>({});
    final localEndpointText = useState("");

    useEffect(() {
      wifiNetworks.value = {...ref.read(authProvider.notifier).getSavedWifiNetworks()};
      final localEndpoint = ref.read(authProvider.notifier).getSavedLocalEndpoint();

      if (localEndpoint != null) {
        localEndpointText.value = localEndpoint;
      }

      return null;
    }, []);

    Future<void> saveWifiNetworks(Map<String, String> networks) {
      wifiNetworks.value = networks;
      return ref.read(authProvider.notifier).saveWifiNetworks(networks);
    }

    Future<void> saveLocalEndpoint(String url) {
      localEndpointText.value = url;
      return ref.read(authProvider.notifier).saveLocalEndpoint(url);
    }

    Future<void> handleEditWifiNetwork({String? wifiName}) async {
      final result = await _showWifiNetworkDialog(
        context,
        wifiName: wifiName ?? '',
        endpoint: wifiName == null ? '' : wifiNetworks.value[wifiName] ?? '',
      );

      if (result == null) {
        return;
      }

      final (newWifiName, endpoint) = result;
      if (newWifiName.isEmpty) {
        return;
      }

      //rebuild the map to keep the entry in place when the Wi-Fi name is changed
      final networks = <String, String>{};
      for (final MapEntry(:key, :value) in wifiNetworks.value.entries) {
        if (key == wifiName) {
          networks[newWifiName] = endpoint;
        } else if (key != newWifiName) {
          networks[key] = value;
        }
      }
      networks[newWifiName] = endpoint;

      await saveWifiNetworks(networks);
    }

    void handleRemoveWifiNetwork(String wifiName) {
      unawaited(saveWifiNetworks({...wifiNetworks.value}..remove(wifiName)));
    }

    Future<void> handleEditServerEndpoint() async {
      final localEndpoint = await _showEditDialog(
        context,
        context.t.server_endpoint,
        "http://local-ip:2283",
        localEndpointText.value,
        isUrlField: true,
      );

      if (localEndpoint != null) {
        await saveLocalEndpoint(localEndpoint);
      }
    }

    Future<void> autofillCurrentNetwork() async {
      final wifiName = await ref.read(networkProvider.notifier).getWifiName();
      if (!context.mounted) {
        return;
      }

      if (wifiName == null) {
        context.showSnackBar(
          SnackBar(
            content: Text(
              context.t.get_wifiname_error,
              style: context.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: context.colorScheme.onSecondary,
              ),
            ),
            backgroundColor: context.colorScheme.secondary,
          ),
        );
      } else if (!wifiNetworks.value.containsKey(wifiName)) {
        unawaited(saveWifiNetworks({...wifiNetworks.value, wifiName: ''}));
      }

      final serverEndpoint = ref.read(authProvider.notifier).getServerEndpoint();

      if (serverEndpoint != null && localEndpointText.value.isEmpty) {
        unawaited(saveLocalEndpoint(serverEndpoint));
      }
    }

    final valueStyle = context.textTheme.labelLarge?.copyWith(
      color: enabled ? context.primaryColor : context.colorScheme.onSurface.withAlpha(100),
      fontFamily: 'GoogleSansCode',
    );

    Widget buildWifiNetworkTile(String wifiName, String endpoint) {
      return Dismissible(
        key: ValueKey('wifi_$wifiName'),
        direction: enabled ? DismissDirection.endToStart : DismissDirection.none,
        onDismissed: (_) => handleRemoveWifiNetwork(wifiName),
        background: Container(
          color: Colors.red,
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 16),
          child: const Icon(Icons.delete, color: Colors.white),
        ),
        child: ListTile(
          enabled: enabled,
          contentPadding: const EdgeInsets.only(left: 24, right: 8),
          leading: const Icon(Icons.wifi_rounded),
          title: Text(wifiName, style: valueStyle?.copyWith(fontWeight: FontWeight.bold)),
          subtitle: endpoint.isEmpty ? Text(context.t.uses_default_endpoint) : Text(endpoint, style: valueStyle),
          trailing: IconButton(
            onPressed: enabled ? () => handleEditWifiNetwork(wifiName: wifiName) : null,
            icon: const Icon(Icons.edit_rounded),
          ),
        ),
      );
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
              border: Border.all(color: context.colorScheme.surfaceContainerHighest, width: 1),
            ),
            child: Stack(
              children: [
                Positioned(
                  bottom: -36,
                  right: -36,
                  child: Icon(Icons.home_outlined, size: 120, color: context.primaryColor.withValues(alpha: 0.05)),
                ),
                ListView(
                  padding: const EdgeInsets.symmetric(vertical: 16.0),
                  physics: const ClampingScrollPhysics(),
                  shrinkWrap: true,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 24),
                      child: Text(context.t.local_network_sheet_info, style: context.textTheme.bodyMedium),
                    ),
                    const SizedBox(height: 4),
                    Divider(color: context.colorScheme.surfaceContainerHighest),
                    ListTile(
                      enabled: enabled,
                      contentPadding: const EdgeInsets.only(left: 24, right: 8),
                      leading: const Icon(Icons.lan_rounded),
                      title: Text(context.t.server_endpoint),
                      subtitle: localEndpointText.value.isEmpty
                          ? const Text("http://local-ip:2283")
                          : Text(localEndpointText.value, style: valueStyle),
                      trailing: IconButton(
                        onPressed: enabled ? handleEditServerEndpoint : null,
                        icon: const Icon(Icons.edit_rounded),
                      ),
                    ),
                    Divider(color: context.colorScheme.surfaceContainerHighest),
                    if (wifiNetworks.value.isEmpty)
                      ListTile(
                        enabled: enabled,
                        contentPadding: const EdgeInsets.only(left: 24, right: 8),
                        leading: const Icon(Icons.wifi_rounded),
                        title: Text(context.t.wifi_name),
                        subtitle: Text(context.t.enter_wifi_name),
                        trailing: IconButton(
                          onPressed: enabled ? handleEditWifiNetwork : null,
                          icon: const Icon(Icons.edit_rounded),
                        ),
                      )
                    else
                      for (final MapEntry(:key, :value) in wifiNetworks.value.entries)
                        buildWifiNetworkTile(key, value),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.add),
                          label: Text(context.t.add_wifi_network),
                          onPressed: enabled ? handleEditWifiNetwork : null,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton.icon(
                          icon: const Icon(Icons.wifi_find_rounded),
                          label: Text(context.t.use_current_connection),
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
