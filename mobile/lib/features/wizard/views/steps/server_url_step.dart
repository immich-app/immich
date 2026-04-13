import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../providers/wizard_provider.dart';

class ServerUrlStep extends HookConsumerWidget {
  const ServerUrlStep({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(wizardLogicProvider);
    final notifier = ref.read(wizardLogicProvider.notifier);
    
    // Using a hook to manage the text controller keeps the code clean
    final controller = useTextEditingController(text: state.serverUrl);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Using the theme's primary color instead of hardcoded blue
        Icon(
          Icons.dns_outlined, 
          size: 80, 
          color: Theme.of(context).colorScheme.primary
        ),
        const SizedBox(height: 24),
        const Text(
          "Connect to Hearth Hub", 
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        const Text(
          "Enter your self-hosted instance URL to begin managing your data.",
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
        const SizedBox(height: 40),
        TextField(
          controller: controller,
          autofocus: true, // Auto-focus for a smoother desktop experience
          keyboardType: TextInputType.url,
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            labelText: "Server URL",
            hintText: "https://photos.yourdomain.com",
            errorText: state.errorMessage,
            prefixIcon: const Icon(Icons.link),
            border: const OutlineInputBorder(),
            // Clears error as soon as the user starts typing again
            helperText: "Example: https://192.168.1.50:2283",
          ),
          onChanged: (val) => notifier.setServerUrl(val),
          onSubmitted: (_) => state.isLoading ? null : notifier.validateServer(),
        ),
        const SizedBox(height: 32),
        SizedBox(
          height: 50,
          width: double.infinity,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: state.isLoading ? null : () => notifier.validateServer(),
            child: state.isLoading 
              ? const SizedBox(
                  height: 20, 
                  width: 20, 
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text("Connect to Server", style: TextStyle(fontSize: 16)),
          ),
        ),
      ],
    );
  }
}