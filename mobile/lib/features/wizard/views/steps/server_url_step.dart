import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/features/wizard/models/wizard_state.dart';
import 'package:immich_mobile/features/wizard/views/qr_scanner_view.dart';
import '../../providers/wizard_provider.dart';

class ServerUrlStep extends HookConsumerWidget {
  const ServerUrlStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(wizardLogicProvider);
    final notifier = ref.read(wizardLogicProvider.notifier);

    // Surface any connection failure as a SnackBar so the user gets immediate
    // feedback when "Connect Manually" or a QR scan can't reach the server.
    ref.listen<WizardState>(wizardLogicProvider, (prev, next) {
      final msg = next.errorMessage;
      if (msg != null && msg.isNotEmpty && prev?.errorMessage != msg) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            SnackBar(
              content: Text(msg),
              backgroundColor: Theme.of(context).colorScheme.error,
              duration: const Duration(seconds: 5),
              behavior: SnackBarBehavior.floating,
            ),
          );
      }
    });

    // While mDNS is in flight (or already succeeded but we haven't transitioned
    // yet) we show a clean, calm loading state - no red error copy.
    if (state.discoveryStatus != WizardDiscoveryStatus.discoveryFailed) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 24),
          const Text("Finding Hearth Hub", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          const Text(
            "Searching your local network for the Hearth Hub appliance.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
        ],
      );
    }

    return _DiscoveryFailedView(state: state, notifier: notifier);
  }
}

class _DiscoveryFailedView extends HookConsumerWidget {
  const _DiscoveryFailedView({required this.state, required this.notifier});

  final WizardState state;
  final WizardLogic notifier;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useTextEditingController(text: state.serverUrl);

    Future<void> openQrScanner() async {
      final scanned = await Navigator.of(
        context,
      ).push<String>(MaterialPageRoute(builder: (_) => const QrScannerView()));
      if (scanned != null && scanned.isNotEmpty) {
        await notifier.connectToServer(scanned);
      }
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(Icons.dns_outlined, size: 80, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 24),
        const Text("Connect to Hearth Hub", style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        const Text(
          "Scan the QR code on your Hearth Hub, or enter its address manually.",
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
        const SizedBox(height: 32),
        SizedBox(
          height: 50,
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text("Scan Hearth Hub", style: TextStyle(fontSize: 16)),
            onPressed: state.isLoading ? null : openQrScanner,
          ),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: controller,
          keyboardType: TextInputType.url,
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(
            labelText: "Server URL",
            hintText: "http://hearth-hub.local",
            prefixIcon: Icon(Icons.link),
            border: OutlineInputBorder(),
            helperText: "Port 2283 is appended automatically.",
          ),
          onChanged: (val) => notifier.setServerUrl(val),
          onSubmitted: (_) => state.isLoading ? null : notifier.validateServer(),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 50,
          width: double.infinity,
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            onPressed: state.isLoading ? null : () => notifier.validateServer(),
            child: state.isLoading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text("Connect Manually", style: TextStyle(fontSize: 16)),
          ),
        ),
      ],
    );
  }
}
