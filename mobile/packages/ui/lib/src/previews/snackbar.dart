import 'package:flutter/material.dart';
import 'package:immich_ui/src/constants.dart';
import 'package:immich_ui/src/previews.dart';
import 'package:immich_ui/src/snackbar.dart';

@ImmichPreview(group: 'Snackbar', name: 'Types')
Widget previewSnackbarTypes() => const _SnackbarDemo();

class _SnackbarDemo extends StatelessWidget {
  const _SnackbarDemo();

  @override
  Widget build(BuildContext context) {
    return ScaffoldMessenger(
      key: scaffoldMessengerKey,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Center(
          child: Wrap(
            spacing: ImmichSpacing.md,
            runSpacing: ImmichSpacing.md,
            children: [
              ElevatedButton(onPressed: () => snackbar.info('Info message'), child: const Text('Info')),
              ElevatedButton(onPressed: () => snackbar.success('Saved'), child: const Text('Success')),
              ElevatedButton(onPressed: () => snackbar.error('Something failed'), child: const Text('Error')),
            ],
          ),
        ),
      ),
    );
  }
}
