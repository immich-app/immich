import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/cast_manager_state.dart';
import 'package:immich_mobile/providers/cast.provider.dart';

class CastDialog extends ConsumerWidget {
  const CastDialog({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AlertDialog(
      title: const Text(
        "cast",
        style: TextStyle(fontWeight: FontWeight.bold),
      ).tr(),
      content: SizedBox(
        width: 250,
        height: 250,
        child: FutureBuilder<List<(String, CastDestinationType, dynamic)>>(
          future: ref.read(castProvider.notifier).getDevices(),
          builder: (context, snapshot) {
            final cast = ref.read(castProvider.notifier);

            if (snapshot.hasError) {
              return Text(
                'Error: ${snapshot.error.toString()}',
              );
            } else if (!snapshot.hasData) {
              return const SizedBox(
                height: 48,
                child: Center(child: CircularProgressIndicator()),
              );
            }

            if (snapshot.data!.isEmpty) {
              return const Text(
                'no_cast_devices_found',
              ).tr();
            }

            return ListView.builder(
              shrinkWrap: true,
              itemCount: snapshot.data!.length,
              itemBuilder: (context, index) {
                final found = snapshot.data![index];
                final deviceName = found.$1;
                final type = found.$2;
                final deviceObj = found.$3;

                return ListTile(
                  title: Text(deviceName),
                  leading: Icon(
                    type == CastDestinationType.googleCast
                        ? Icons.cast
                        : Icons.cast_connected,
                  ),
                  onTap: () {
                    cast.connect(type, deviceObj);
                  },
                );
              },
            );
          },
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => context.pop(),
          child: Text(
            "close",
            style: TextStyle(
              color: context.colorScheme.tertiary,
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
      ],
    );
  }
}
