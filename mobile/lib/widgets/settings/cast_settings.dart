import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_ui/immich_ui.dart';

class CastSettings extends HookConsumerWidget {
  const CastSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final controller = useTextEditingController(text: config.castReceiverAppId);
    final serverAppId = ref.watch(serverInfoProvider.select((s) => s.serverConfig.castReceiverAppId));
    final isCasting = ref.watch(castProvider.select((s) => s.isCasting));

    return SettingsSubPageScaffold(
      settings: [
        SwitchListTile(
          title: Text(context.t.cast_enabled_on_device),
          value: config.castEnabled,
          onChanged: (enabled) async {
            if (!enabled && isCasting) {
              await ref.read(castProvider.notifier).disconnect();
            }
            await ref.read(settingsProvider).write(.castEnabled, enabled);
          },
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: controller,
                enabled: !isCasting,
                autocorrect: false,
                enableSuggestions: false,
                decoration: InputDecoration(
                  labelText: context.t.cast_receiver_app_id_override,
                  hintText: serverAppId,
                  helperText: context.t.cast_receiver_app_id_override_description,
                  helperMaxLines: 4,
                ),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: isCasting
                    ? null
                    : () async {
                        await ref.read(settingsProvider).write(.castReceiverAppId, controller.text.trim());
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(context.t.saved_settings)));
                        }
                      },
                child: Text(context.t.save),
              ),
              if (serverAppId.trim().isEmpty && config.castReceiverAppId.isEmpty)
                Text(context.t.cast_receiver_not_configured),
            ],
          ),
        ),
      ],
    );
  }
}
