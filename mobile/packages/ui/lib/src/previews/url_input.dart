import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/url_input.dart';
import 'package:immich_ui/src/previews.dart';

@ImmichPreview(group: 'URLInput', name: 'Basic')
Widget previewUrlInput() => const _PreviewUrlInput();

class _PreviewUrlInput extends StatefulWidget {
  const _PreviewUrlInput();

  @override
  State<_PreviewUrlInput> createState() => _PreviewUrlInputState();
}

class _PreviewUrlInputState extends State<_PreviewUrlInput> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ImmichURLInput(label: 'Server URL', hintText: 'https://demo.immich.com', controller: _controller);
  }
}
