import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/forms/login/loading_icon.dart';
import 'package:immich_mobile/widgets/forms/login/server_endpoint_input.dart';

class ServerSelectionForm extends StatelessWidget {
  final TextEditingController serverEndpointController;
  final FocusNode serverEndpointFocusNode;
  final bool isLoading;
  final VoidCallback onSubmit;

  const ServerSelectionForm({
    super.key,
    required this.serverEndpointController,
    required this.serverEndpointFocusNode,
    required this.isLoading,
    required this.onSubmit,
  });

  static const double _buttonRadius = 25.0;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ServerEndpointInput(
          controller: serverEndpointController,
          focusNode: serverEndpointFocusNode,
          onSubmit: onSubmit,
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(_buttonRadius),
                      bottomLeft: Radius.circular(_buttonRadius),
                    ),
                  ),
                ),
                onPressed: () => context.pushRoute(const SettingsRoute()),
                icon: const Icon(Icons.settings_rounded),
                label: const Text(""),
              ),
            ),
            const SizedBox(width: 1),
            Expanded(
              flex: 3,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.only(
                      topRight: Radius.circular(_buttonRadius),
                      bottomRight: Radius.circular(_buttonRadius),
                    ),
                  ),
                ),
                onPressed: isLoading ? null : onSubmit,
                icon: const Icon(Icons.arrow_forward_rounded),
                label: const Text('next', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)).tr(),
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        if (isLoading) const LoadingIcon(),
      ],
    );
  }
}
