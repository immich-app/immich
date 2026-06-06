import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/text_input.dart';
import 'package:immich_ui/src/previews.dart';

@ImmichPreview(group: 'TextInput', name: 'Basic')
Widget previewTextInputBasic() => const _PreviewTextInputBasic();

@ImmichPreview(group: 'TextInput', name: 'With Validator')
Widget previewTextInputValidator() => const _PreviewTextInputValidator();

class _PreviewTextInputBasic extends StatefulWidget {
  const _PreviewTextInputBasic();

  @override
  State<_PreviewTextInputBasic> createState() => _PreviewTextInputBasicState();
}

class _PreviewTextInputBasicState extends State<_PreviewTextInputBasic> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ImmichTextInput(
      label: 'Email',
      hintText: 'Enter your email',
      controller: _controller,
      keyboardType: TextInputType.emailAddress,
    );
  }
}

class _PreviewTextInputValidator extends StatefulWidget {
  const _PreviewTextInputValidator();

  @override
  State<_PreviewTextInputValidator> createState() => _PreviewTextInputValidatorState();
}

class _PreviewTextInputValidatorState extends State<_PreviewTextInputValidator> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ImmichTextInput(
      label: 'Username',
      controller: _controller,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Username is required';
        }
        if (value.length < 3) {
          return 'Username must be at least 3 characters';
        }
        return null;
      },
    );
  }
}
