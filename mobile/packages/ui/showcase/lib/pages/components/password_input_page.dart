import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/component_examples.dart';
import 'package:showcase/widgets/example_card.dart';
import 'package:showcase/widgets/page_title.dart';

class PasswordInputPage extends StatelessWidget {
  const PasswordInputPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PageTitle(
      title: AppRoute.passwordInput.name,
      child: ComponentExamples(
        title: 'ImmichPasswordInput',
        subtitle: 'Password field with visibility toggle.',
        examples: [
          ExampleCard(
            title: 'Password Input',
            preview: ImmichPasswordInput(
              label: 'Password',
              hintText: 'Enter your password',
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Password is required';
                }
                if (value.length < 8) {
                  return 'Password must be at least 8 characters';
                }
                return null;
              },
            ),
          ),
        ],
      ),
    );
  }
}
