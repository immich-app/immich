import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:network_info_plus/network_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class NetworkingSettings extends HookConsumerWidget {
  const NetworkingSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final primaryEndpoint = Store.tryGet(StoreKey.serverEndpoint);

    checkNetwork() async {
      final connectivityResult = await Connectivity().checkConnectivity();
      print('Connectivity: $connectivityResult');
      if (connectivityResult.contains(ConnectivityResult.wifi)) {
        // Get the current Wi-Fi network's SSID
        final ssid = NetworkInfo();
        print(await ssid.getWifiBSSID());
        print(await ssid.getWifiSubmask());
        print(await ssid.getWifiIP());
        print(await ssid.getWifiName());

        if (await Permission.locationWhenInUse.request().isGranted) {
          print("WIFI name");
          print(await ssid.getWifiName());
        } else {
          final perm = await Permission.locationWhenInUse.request();
          print("WIFI name unauthorized $perm");
        }
      } else {
        print('Device is not connected to Wi-Fi');
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: ListView(
        shrinkWrap: true,
        children: [
          Text(
            "Server Endpoint",
            style: context.textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            "The app will attempt to connect to the primary endpoint. If the connection fails, the app will attempt to connect to the secondary endpoint.",
            style: context.textTheme.bodyMedium?.copyWith(
              color: context.colorScheme.onSurface.withOpacity(0.8),
            ),
          ),
          const SizedBox(height: 24),
          TextField(
            keyboardType: TextInputType.url,
            style: TextStyle(
              fontSize: 16,
              wordSpacing: 1.5,
              fontFamily: 'Inconsolata',
              fontWeight: FontWeight.w600,
            ),
            decoration: InputDecoration(
              labelText: "Primary",
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16.0,
              ),
              filled: true,
              fillColor: context.colorScheme.surfaceContainerLow,
            ),
            controller: TextEditingController(text: primaryEndpoint),
          ),
          const SizedBox(height: 16),
          TextField(
            keyboardType: TextInputType.url,
            style: TextStyle(
              fontSize: 16,
              wordSpacing: 1.5,
              fontFamily: 'Inconsolata',
              fontWeight: FontWeight.w600,
            ),
            decoration: InputDecoration(
              labelText: "Secondary",
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16.0,
              ),
              filled: true,
              fillColor: context.colorScheme.surfaceContainerLow,
            ),
            controller: TextEditingController(text: primaryEndpoint),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: checkNetwork,
            child: Text('Save'),
          ),
        ],
      ),
    );
  }
}
