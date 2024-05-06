import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/activities/activity_tile.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

/// Wraps an [ActivityTile] and makes it dismissible
class DismissibleActivity extends StatelessWidget {
  final String activityId;
  final ActivityTile body;
  final Function(String)? onDismiss;

  const DismissibleActivity(
    this.activityId,
    this.body, {
    this.onDismiss,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(activityId),
      dismissThresholds: const {
        DismissDirection.horizontal: 0.7,
      },
      direction: DismissDirection.horizontal,
      confirmDismiss: (direction) => onDismiss != null
          ? showDialog(
              context: context,
              builder: (context) => ConfirmDialog(
                onOk: () {},
                title: "shared_album_activity_remove_title",
                content: "shared_album_activity_remove_content",
                ok: "delete_dialog_ok",
              ),
            )
          : Future.value(false),
      onDismissed: (_) async => onDismiss?.call(activityId),
      // LTR
      background: _DismissBackground(withDeleteIcon: onDismiss != null),
      // RTL
      secondaryBackground: _DismissBackground(
        withDeleteIcon: onDismiss != null,
        alignment: AlignmentDirectional.centerEnd,
      ),
      child: body,
    );
  }
}

class _DismissBackground extends StatelessWidget {
  final AlignmentDirectional alignment;
  final bool withDeleteIcon;

  const _DismissBackground({
    required this.withDeleteIcon,
    this.alignment = AlignmentDirectional.centerStart,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      alignment: alignment,
      color: withDeleteIcon ? Colors.red[400] : Colors.grey[600],
      child: withDeleteIcon
          ? const Padding(
              padding: EdgeInsets.all(15),
              child: Icon(
                Icons.delete_sweep_rounded,
                color: Colors.black,
              ),
            )
          : null,
    );
  }
}
