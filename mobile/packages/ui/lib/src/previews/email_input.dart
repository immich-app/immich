import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/email_input.dart';
import 'package:immich_ui/src/previews.dart';

@ImmichPreview(group: 'EmailInput', name: 'Basic')
Widget previewEmailInput() => const _PreviewEmailInput();

class _PreviewEmailInput extends StatefulWidget {
  const _PreviewEmailInput();

  @override
  State<_PreviewEmailInput> createState() => _PreviewEmailInputState();
}

class _PreviewEmailInputState extends State<_PreviewEmailInput> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ImmichEmailInput(label: 'Email', hintText: 'user@immich.app', controller: _controller);
  }
}
