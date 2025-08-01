import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

class SharedLinkPasswordDialog extends StatefulWidget {
  const SharedLinkPasswordDialog({super.key});

  @override
  State<SharedLinkPasswordDialog> createState() => _SharedLinkPasswordDialogState();
}

class _SharedLinkPasswordDialogState extends State<SharedLinkPasswordDialog> {
  final TextEditingController controller = TextEditingController();
  bool isNotEmpty = false;

  @override
  void initState() {
    super.initState();
    controller.addListener(() {
      setState(() {
        isNotEmpty = controller.text.isNotEmpty;
      });
    });
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10))),
      title: const Text("shared_link_password_dialog_title").t(context: context),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text("shared_link_password_dialog_content").t(context: context),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            decoration: InputDecoration(hintText: "password".t(context: context)),
            obscureText: true,
            autofocus: true,
            onSubmitted: (value) {
              Navigator.pop(context, value);
            },
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, null),
          style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.secondary),
          child: const Text("cancel").t(context: context),
        ),
        TextButton(
          onPressed: isNotEmpty
              ? () {
                  Navigator.pop(context, controller.text);
                }
              : null,
          child: Text(
            "submit".t(context: context),
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
