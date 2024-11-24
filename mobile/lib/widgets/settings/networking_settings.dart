import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';

class NetworkingSettings extends HookConsumerWidget {
  const NetworkingSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final primaryEndpoint = Store.tryGet(StoreKey.serverEndpoint);

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      children: [
        Text(
          "Server Endpoint",
          style: context.textTheme.headlineSmall,
        ),
        Text(
          "The primary endpoint is typically the local IP address of the server, while the secondary endpoint is the public DNS address. The app will attempt to connect to the primary endpoint. If the connection fails, the app will attempt to connect to the secondary endpoint.",
          style: context.textTheme.bodyMedium?.copyWith(
            color: context.colorScheme.onSurface.withOpacity(0.8),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Primary',
          style: context.textTheme.labelLarge,
        ),
        const SizedBox(height: 8),
        Text(
          primaryEndpoint ?? "",
          style: TextStyle(
            color: context.primaryColor,
            fontSize: 16,
            wordSpacing: 1.5,
            fontFamily: 'Inconsolata',
            fontWeight: FontWeight.w600,
          ),
        ),
        // TextField(
        //   enabled: false,
        //   style: context.textTheme.bodyLarge!.copyWith(
        //     color: context.colorScheme.onSurface.withOpacity(0.8),
        //   ),
        //   decoration: InputDecoration(
        //     contentPadding: const EdgeInsets.symmetric(
        //       horizontal: 16,
        //       vertical: 16.0,
        //     ),
        //     disabledBorder: OutlineInputBorder(
        //       borderRadius: BorderRadius.circular(16),
        //       borderSide: BorderSide(
        //         color: context.colorScheme.surfaceContainer,
        //       ),
        //     ),
        //     filled: true,
        //     // fillColor: Colors.grey[200],
        //   ),
        //   controller: TextEditingController(text: primaryEndpoint),
        // ),
        const SizedBox(height: 16),
        Text(
          'Secondary',
          style: context.textTheme.labelLarge,
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}
