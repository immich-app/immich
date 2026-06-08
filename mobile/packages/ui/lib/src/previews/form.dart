import 'package:flutter/material.dart';
import 'package:immich_ui/src/components/form.dart';
import 'package:immich_ui/src/components/password_input.dart';
import 'package:immich_ui/src/components/text_input.dart';
import 'package:immich_ui/src/constants.dart';
import 'package:immich_ui/src/previews.dart';

@ImmichPreview(group: 'Form', name: 'Login Form')
Widget previewFormLogin() => const _PreviewLoginForm();

class _PreviewLoginForm extends StatefulWidget {
  const _PreviewLoginForm();

  @override
  State<_PreviewLoginForm> createState() => _PreviewLoginFormState();
}

class _PreviewLoginFormState extends State<_PreviewLoginForm> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _result = '';

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ImmichForm(
          submitText: 'Login',
          submitIcon: Icons.login,
          onSubmit: () async {
            await Future<void>.delayed(const Duration(seconds: 1));
            if (!mounted) {
              return;
            }
            setState(() {
              _result = 'Form submitted!';
            });
          },
          builder: (context, form) => Column(
            spacing: ImmichSpacing.sm,
            children: [
              ImmichTextInput(
                label: 'Email',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
              ),
              ImmichPasswordInput(
                label: 'Password',
                controller: _passwordController,
                validator: (value) => value?.isEmpty ?? true ? 'Required' : null,
                onSubmit: (_) => form.submit(),
              ),
            ],
          ),
        ),
        if (_result.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(_result, style: const TextStyle(color: Colors.green)),
        ],
      ],
    );
  }
}
