import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/cast/cast_manager_state.dart';
import 'package:immich_mobile/providers/cast.provider.dart';

class CastDialog extends ConsumerWidget {
  const CastDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final castManager = ref.watch(castProvider);

    bool isCurrentDevice(String deviceName) {
      return castManager.receiverName == deviceName && castManager.isCasting;
    }

    bool isDeviceConnecting(String deviceName) {
      return castManager.receiverName == deviceName && !castManager.isCasting;
    }

    return AlertDialog(
      title: const Text("cast", style: TextStyle(fontWeight: FontWeight.bold)).tr(),
      content: SizedBox(
        width: 250,
        height: 250,
        child: FutureBuilder<List<(String, CastDestinationType, dynamic)>>(
          future: ref.read(castProvider.notifier).getDevices(),
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return Text('error_saving_image'.tr(args: [snapshot.error.toString()]));
            } else if (!snapshot.hasData) {
              return const SizedBox(height: 48, child: Center(child: CircularProgressIndicator()));
            }

            if (snapshot.data!.isEmpty) {
              return const Text('no_cast_devices_found').tr();
            }

            final devices = snapshot.data!;
            final connected = devices.where((d) => isCurrentDevice(d.$1)).toList();
            final others = devices.where((d) => !isCurrentDevice(d.$1)).toList();

            final List<dynamic> sectionedList = [];

            if (connected.isNotEmpty) {
              sectionedList.add("connected_device");
              sectionedList.addAll(connected);
            }

            if (others.isNotEmpty) {
              sectionedList.add("discovered_devices");
              sectionedList.addAll(others);
            }

            return ListView.builder(
              shrinkWrap: true,
              itemCount: sectionedList.length,
              itemBuilder: (context, index) {
                final item = sectionedList[index];

                if (item is String) {
                  // It's a section header
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: Text(item, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)).tr(),
                  );
                } else {
                  final (deviceName, type, deviceObj) = item as (String, CastDestinationType, dynamic);

                  return ListTile(
                    title: Text(
                      deviceName,
                      style: TextStyle(color: isCurrentDevice(deviceName) ? context.colorScheme.primary : null),
                    ),
                    leading: Icon(
                      type == CastDestinationType.googleCast ? Icons.cast : Icons.cast_connected,
                      color: isCurrentDevice(deviceName) ? context.colorScheme.primary : null,
                    ),
                    trailing: isCurrentDevice(deviceName)
                        ? Icon(Icons.check, color: context.colorScheme.primary)
                        : isDeviceConnecting(deviceName)
                        ? const CircularProgressIndicator()
                        : null,
                    onTap: () async {
                      if (isDeviceConnecting(deviceName)) {
                        return;
                      }

                      if (castManager.isCasting) {
                        await ref.read(castProvider.notifier).disconnect();
                      }

                      if (!isCurrentDevice(deviceName)) {
                        ref.read(castProvider.notifier).connect(type, deviceObj);
                      }
                    },
                  );
                }
              },
            );
          },
        ),
      ),
      actions: [
        if (castManager.isCasting)
          TextButton(
            onPressed: () => ref.read(castProvider.notifier).disconnect(),
            child: Text(
              "stop_casting",
              style: TextStyle(color: context.colorScheme.secondary, fontWeight: FontWeight.bold),
            ).tr(),
          ),
        TextButton(
          onPressed: () => context.pop(),
          child: Text(
            "close",
            style: TextStyle(color: context.colorScheme.primary, fontWeight: FontWeight.bold),
          ).tr(),
        ),
      ],
    );
  }
}
