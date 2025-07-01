import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class ShareActionButton extends ConsumerWidget {
  const ShareActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData:
          Platform.isAndroid ? Icons.share_rounded : Icons.ios_share_rounded,
      label: 'share'.t(context: context),
    );
  }
}
