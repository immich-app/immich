import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/share_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_app_bar/base_bottom_sheet.widget.dart';

class HomeBottomAppBar extends ConsumerWidget {
  const HomeBottomAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const BaseBottomSheet(
      actions: [
        ShareActionButton(),
      ],
    );
  }
}
