import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
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
            border: OutlineInputBorder(),
            hintText: hintText,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL', style: TextStyle(color: Colors.red)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, controller.text),
            child: const Text('SAVE'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    handleEditWifiName() async {
      final result = await _showEditDialog(
        context,
        "WiFi Name",
        "Your Wi-Fi name",
        "enter-WiFi-name",
      );

      if (result != null) {
        // await networkNotifier.setWifiSSID(result);
      }
    }

    handleEditServerEndpoint() async {
      final result = await _showEditDialog(
        context,
        "Server Endpoint",
        "http://local-ip:2283/api",
        "enter-server-endpoint",
      );

      if (result != null) {
        // await networkNotifier.setServerEndpoint(result);
      }
    }

    handleDiscoverNetwork() async {
      final wifiName = await ref.read(networkProvider.notifier).getWifiName();
      print("WiFi Name: $wifiName");
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Stack(
        children: [
          Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: context.colorScheme.surfaceContainerLow,
              border: Border.all(
                color: context.colorScheme.surfaceContainerHighest,
                width: 1,
              ),
            ),
            child: Stack(
              children: [
                ListView(
                  padding: EdgeInsets.symmetric(vertical: 16.0),
                  physics: ClampingScrollPhysics(),
                  shrinkWrap: true,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: 4.0,
                        horizontal: 24,
                      ),
                      child: Text(
                        "When connect to the following Wi-Fi network, the app will prioritize connecting to the server at the following endpoint",
                        style: context.textTheme.bodyMedium,
                      ),
                    ),
                    SizedBox(height: 4),
                    Divider(
                      color: context.colorScheme.surfaceContainerHighest,
                    ),
                    ListTile(
                      contentPadding: EdgeInsets.only(left: 24, right: 8),
                      leading: Icon(Icons.wifi_rounded),
                      title: Text("WiFi Name"),
                      subtitle: Text("enter-WiFi-name"),
                      trailing: IconButton(
                        onPressed: enabled ? handleEditWifiName : null,
                        icon: Icon(Icons.edit_rounded),
                      ),
                    ),
                    ListTile(
                      contentPadding: EdgeInsets.only(left: 24, right: 8),
                      leading: Icon(Icons.lan_rounded),
                      title: Text("Server Endpoint"),
                      subtitle: Text("enter-server-endpoint"),
                      trailing: IconButton(
                        onPressed: enabled ? handleEditServerEndpoint : null,
                        icon: Icon(Icons.edit_rounded),
                      ),
                    ),
                    SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24.0,
                      ),
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton.icon(
                          icon: Icon(Icons.wifi_find_rounded),
                          label: Text('DISCOVER'),
                          onPressed: enabled ? handleDiscoverNetwork : null,
                        ),
                      ),
                    ),
                  ],
                ),
                Positioned(
                  bottom: -36,
                  right: -36,
                  child: Icon(
                    Icons.home_outlined,
                    size: 120,
                    color: context.primaryColor.withOpacity(0.05),
                  ),
                ),
                if (!enabled)
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 2.5, sigmaY: 2.5),
                        child: Container(
                          color: context.colorScheme.surface.withOpacity(0.5),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
