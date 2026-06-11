import 'dart:async';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class RestoreActionButton extends ConsumerWidget {
  final ActionSource source;
  final bool iconOnly;
  final bool menuItem;

  const RestoreActionButton({super.key, required this.source, this.iconOnly = false, this.menuItem = false});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    final currentAsset = ref.read(assetViewerProvider).currentAsset;
    final shouldReopenAsViewIntent = _isViewIntentTrashViewer(ref);
    final result = await ref.read(actionProvider.notifier).restoreTrash(source);
    ref.read(multiSelectProvider.notifier).reset();

    if (source == ActionSource.viewer) {
      final handled = result.success && shouldReopenAsViewIntent && currentAsset is RemoteAsset
          ? await _reopenRestoredViewIntentAsset(context, ref, currentAsset.id)
          : false;
      if (!handled) {
        EventStream.shared.emit(const ViewerReloadAssetEvent());
      }
    }

    final successMessage = 'assets_restored_count'.t(context: context, args: {'count': result.count.toString()});

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: result.success ? successMessage : 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: result.success ? ToastType.success : ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.history_rounded,
      label: 'restore'.t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
      maxWidth: 100.0,
    );
  }

  bool _isViewIntentTrashViewer(WidgetRef ref) {
    final timelineService = ref.read(timelineServiceProvider);

    return timelineService.origin == TimelineOrigin.deepLinkTrash;
  }

  Future<bool> _reopenRestoredViewIntentAsset(BuildContext context, WidgetRef ref, String remoteAssetId) async {
    final restoredAsset = await ref.read(assetServiceProvider).getRemoteAsset(remoteAssetId);
    if (restoredAsset == null) {
      return false;
    }

    final timelineService = ref.read(timelineFactoryProvider).fromAssets([restoredAsset], TimelineOrigin.deepLink);
    final notifier = ref.read(assetViewerProvider.notifier);
    notifier.reset();
    if (restoredAsset.isVideo) {
      notifier.setControls(false);
    }
    notifier.setAsset(restoredAsset);

    if (!context.mounted) {
      return true;
    }

    final router = ref.read(appRouterProvider);
    router.popUntilRoot();
    unawaited(
      router.push(
        AssetViewerRoute(
          key: ValueKey('restored-view-intent-$remoteAssetId'),
          initialIndex: 0,
          timelineService: timelineService,
        ),
      ),
    );
    return true;
  }
}
