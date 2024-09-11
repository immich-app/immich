import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

class ShareDialog extends StatelessWidget {
  const ShareDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          Container(
            margin: const EdgeInsets.only(top: 12),
            child: const Text('share_dialog_preparing').tr(),
          ),
        ],
      ),
    );
  }
}
