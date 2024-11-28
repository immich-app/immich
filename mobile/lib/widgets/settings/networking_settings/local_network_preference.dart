import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class LocalNetworkPreference extends HookConsumerWidget {
  const LocalNetworkPreference({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: context.colorScheme.surfaceContainerLow,
          border: Border.all(
            color: context.colorScheme.surfaceContainerHigh,
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
                    "When connect to the following Wi-Fi network, the app will always prioritize connecting to the server at the following endpoint",
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
                  subtitle: Text("immich"),
                  trailing: IconButton(
                    onPressed: () {},
                    icon: Icon(Icons.edit_rounded),
                  ),
                ),
                ListTile(
                  contentPadding: EdgeInsets.only(left: 24, right: 8),
                  leading: Icon(Icons.lan_rounded),
                  title: Text("Server Endpoint"),
                  subtitle: Text("http://10.1.15.216:2283/api"),
                  trailing: IconButton(
                    onPressed: () {},
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
                      onPressed: () {
                        // checkNetwork();
                      },
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
          ],
        ),
      ),
    );
  }
}
