import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/component_examples.dart';
import 'package:showcase/widgets/example_card.dart';
import 'package:showcase/widgets/page_title.dart';

class FormPage extends StatefulWidget {
  const FormPage({super.key});

  @override
  State<FormPage> createState() => _FormPageState();
}

class _FormPageState extends State<FormPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _result = '';

  @override
  Widget build(BuildContext context) {
    return PageTitle(
      title: AppRoute.form.name,
      child: ComponentExamples(
        title: 'ImmichForm',
        subtitle:
            'Form container with built-in validation and submit handling.',
        examples: [
          ExampleCard(
            title: 'Login Form',
            preview: Column(
              children: [
                ImmichForm(
                  submitText: 'Login',
                  submitIcon: Icons.login,
                  onSubmit: () async {
                    await Future.delayed(const Duration(seconds: 1));
                    setState(() {
                      _result = 'Form submitted!';
                    });
                  },
                  child: Column(
                    spacing: 10,
                    children: [
                      ImmichTextInput(
                        label: 'Email',
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) =>
                            value?.isEmpty ?? true ? 'Required' : null,
                      ),
                      ImmichPasswordInput(
                        label: 'Password',
                        controller: _passwordController,
                        validator: (value) =>
                            value?.isEmpty ?? true ? 'Required' : null,
                      ),
                    ],
                  ),
                ),
                if (_result.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(_result, style: const TextStyle(color: Colors.green)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
