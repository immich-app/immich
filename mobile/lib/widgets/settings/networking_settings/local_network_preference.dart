import 'dart:ui';

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
        "WiFi Name",
        "Your Wi-Fi name",
        wifiNameText.value,
      );

      if (wifiName != null) {
        await saveWifiName(wifiName);
      }
    }

    handleEditServerEndpoint() async {
      final localEndpoint = await _showEditDialog(
        context,
        "Server Endpoint",
        "http://local-ip:2283/api",
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
              "Cannot get Wi-Fi name, make sure you have granted the necessary permissions and connected to a Wi-Fi network",
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
                        "When connect to the following Wi-Fi network, the app will prioritize connecting to the server at the following endpoint",
                        style: context.textTheme.bodyMedium,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Divider(
                      color: context.colorScheme.surfaceContainerHighest,
                    ),
                    ListTile(
                      contentPadding: const EdgeInsets.only(left: 24, right: 8),
                      leading: const Icon(Icons.wifi_rounded),
                      title: const Text("WiFi Name"),
                      subtitle: wifiNameText.value.isEmpty
                          ? const Text("enter-WiFi-name")
                          : Text(
                              wifiNameText.value,
                              style: context.textTheme.labelLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: context.primaryColor,
                                fontFamily: 'Inconsolata',
                              ),
                            ),
                      trailing: IconButton(
                        onPressed: enabled ? handleEditWifiName : null,
                        icon: const Icon(Icons.edit_rounded),
                      ),
                    ),
                    ListTile(
                      contentPadding: const EdgeInsets.only(left: 24, right: 8),
                      leading: const Icon(Icons.lan_rounded),
                      title: const Text("Server Endpoint"),
                      subtitle: localEndpointText.value.isEmpty
                          ? const Text("http://local-ip:2283/api")
                          : Text(
                              localEndpointText.value,
                              style: context.textTheme.labelLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: context.primaryColor,
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
                          label: const Text('USE CURRENT CONNECTION'),
                          onPressed: enabled ? autofillCurrentNetwork : null,
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
