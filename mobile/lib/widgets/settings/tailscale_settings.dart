import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/widgets/settings/settings_card.dart';
import 'package:immich_mobile/services/tailscale.service.dart';

class TailscaleSettings extends HookConsumerWidget {
  const TailscaleSettings({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final service = TailscaleService.instance;
    final isInitialized = service.isInitialized;
    final enabled = ref.watch(appConfigProvider).network.tailscaleEnabled;
    final authKey = ref.watch(appConfigProvider).network.tailscaleAuthKey;
    final status = service.status;

    return SettingsCard(
      icon: Icons.qr_code_outlined,
      title: context.t.tailscale_settings_title,
      subtitle: _buildSubtitle(context, isInitialized, enabled, status),
      trailing: _buildTrailing(context, enabled),
      onTap: () => _onTap(context, service),
    );
  }

  String _buildSubtitle(
      BuildContext context, bool isInitialized, bool enabled, String? status) {
    if (!isInitialized) {
      return context.t.tailscale_not_configured;
    }
    if (enabled) {
      return status != null
          ? '${context.t.tailscale_connected} ${status.split(' ').first}'
          : context.t.tailscale_connecting;
    }
    return context.t.tailscale_disconnected;
  }

  Widget _buildTrailing(BuildContext context, bool enabled) {
    if (enabled) {
      return const Icon(Icons.check_circle_rounded, color: Colors.green);
    }
    return const Icon(Icons.lock_outlined);
  }

  void _onTap(BuildContext context, TailscaleService service) async {
    if (!service.isInitialized) {
      await service.init(
        stateDir: '/immich/tailscale-state',
        appId: 'org.immich.mobile',
      );
    }

    final status = await service.getStatus();

    if (status != null && status.connected) {
      await service.logout();
    } else {
      _showAuthKeyDialog(context);
    }
  }

  void _showAuthKeyDialog(BuildContext context) {
    final _authKeyController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(context.t.tailscale_login),
          content: TextField(
            controller: _authKeyController,
            decoration: const InputDecoration(labelText: 'Auth Key'),
            obscureText: false,
            enableSuggestions: true,
            autocorrect: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(context.t.cancel),
            ),
            TextButton(
              onPressed: () async {
                await service.login(
                  authKey: _authKeyController.text,
                  hostname: 'immich-mobile',
                );
                Navigator.pop(context);
              },
              child: Text(context.t.login),
            ),
          ],
        );
      },
    );
  }
}