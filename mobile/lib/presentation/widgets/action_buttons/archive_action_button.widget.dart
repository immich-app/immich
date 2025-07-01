import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class ArchiveActionButton extends ConsumerWidget {
  final ActionSource source;

  const ArchiveActionButton({super.key, required this.source});

  onAction(BuildContext context, WidgetRef ref) {
    switch (source) {
      case ActionSource.timeline:
        timelineAction(context, ref);
      case ActionSource.viewer:
        viewerAction(ref);
    }
  }

  void timelineAction(BuildContext context, WidgetRef ref) {
    final user = ref.read(currentUserProvider);
    if (user == null) {
      return;
    }

    final ids = ref
        .read(multiSelectProvider.select((value) => value.selectedAssets))
        .whereType<RemoteAsset>()
        .where((asset) => asset.ownerId == user.id)
        .map((asset) => asset.id)
        .toList();

    if (ids.isEmpty) {
      return;
    }

    ref.read(actionProvider.notifier).archive(ids);
    ref.read(multiSelectProvider.notifier).reset();

    final toastMessage = 'archive_action_prompt'.t(
      context: context,
      args: {'count': ids.length.toString()},
    );

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: toastMessage,
        gravity: ToastGravity.BOTTOM,
      );
    }
  }

  void viewerAction(WidgetRef _) {
    UnimplementedError("Viewer action for archive is not implemented yet.");
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.archive_outlined,
      label: "archive".t(context: context),
      onPressed: () => onAction(context, ref),
    );
  }
}
