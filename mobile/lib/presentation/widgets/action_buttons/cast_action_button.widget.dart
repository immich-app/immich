import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/cast.provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/cast_dialog.dart';

class CastActionButton extends ConsumerWidget {
  const CastActionButton({super.key, this.iconOnly = false, this.menuItem = false});

  final bool iconOnly;
  final bool menuItem;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCasting = ref.watch(castProvider.select((c) => c.isCasting));

    return BaseActionButton(
      iconData: isCasting ? Icons.cast_connected_rounded : Icons.cast_rounded,
      iconColor: isCasting ? context.primaryColor : null, // null = default color
      label: "cast".t(context: context),
      onPressed: () {
        showDialog(context: context, builder: (context) => const CastDialog());
      },
      iconOnly: iconOnly,
      menuItem: menuItem,
    );
  }
}
