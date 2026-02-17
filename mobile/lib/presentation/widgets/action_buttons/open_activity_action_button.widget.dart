import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class OpenActivityActionButton extends ConsumerWidget {
  const OpenActivityActionButton({super.key, this.iconOnly = false, this.menuItem = false});

  final bool iconOnly;
  final bool menuItem;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.chat_outlined,
      label: "activity".t(context: context),
      onPressed: () => EventStream.shared.emit(const ViewerOpenBottomSheetEvent(activitiesMode: true)),
      iconOnly: iconOnly,
      menuItem: menuItem,
    );
  }
}
