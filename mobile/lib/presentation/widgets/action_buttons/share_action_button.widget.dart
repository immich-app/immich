import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class ShareActionButton extends ConsumerWidget {
  const ShareActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData:
          Platform.isAndroid ? Icons.share_rounded : Icons.ios_share_rounded,
      label: context.tr('share'),
    );
  }
}
