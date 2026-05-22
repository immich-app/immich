import 'package:flutter/material.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:showcase/routes.dart';
import 'package:showcase/widgets/component_examples.dart';
import 'package:showcase/widgets/example_card.dart';
import 'package:showcase/widgets/page_title.dart';

class TextInputPage extends StatefulWidget {
  const TextInputPage({super.key});

  @override
  State<TextInputPage> createState() => _TextInputPageState();
}

class _TextInputPageState extends State<TextInputPage> {
  final _controller1 = TextEditingController();
  final _controller2 = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return PageTitle(
      title: AppRoute.textInput.name,
      child: ComponentExamples(
        title: 'ImmichTextInput',
        subtitle: 'Text field with validation support.',
        examples: [
          ExampleCard(
            title: 'Basic Usage',
            preview: Column(
              children: [
                ImmichTextInput(
                  label: 'Email',
                  hintText: 'Enter your email',
                  controller: _controller1,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 16),
                ImmichTextInput(
                  label: 'Username',
                  controller: _controller2,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Username is required';
                    }
                    if (value.length < 3) {
                      return 'Username must be at least 3 characters';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller1.dispose();
    _controller2.dispose();
    super.dispose();
  }
}
