import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/exif.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/location_picker.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class EditLocationActionButton extends ConsumerWidget {
  final ActionSource source;

  const EditLocationActionButton({super.key, required this.source});

  _onTap(BuildContext context, WidgetRef ref) {
    switch (source) {
      case ActionSource.timeline:
        timelineAction(context, ref);
      case ActionSource.viewer:
        viewerAction(ref);
    }
  }

  void timelineAction(BuildContext context, WidgetRef ref) async {
    final user = ref.read(currentUserProvider);
    if (user == null) {
      return;
    }

    final assets = ref
        .read(multiSelectProvider.select((value) => value.selectedAssets))
        .whereType<RemoteAsset>()
        .where((asset) => asset.ownerId == user.id)
        .toList();

    final ids = assets.map((asset) => asset.id).toList();

    if (ids.isEmpty) {
      return;
    }

    LatLng? initialLatLng;
    if (ids.length == 1) {
      final exif = await ref.read(remoteExifRepository).get(assets[0].id);

      if (exif?.latitude != null && exif?.longitude != null) {
        initialLatLng = LatLng(exif!.latitude!, exif.longitude!);
      }
    }

    final location = await showLocationPicker(
      context: context,
      initialLatLng: initialLatLng,
    );

    if (location == null) {
      return;
    }

    final result =
        await ref.read(actionProvider.notifier).editLocation(ids, location);
    ref.read(multiSelectProvider.notifier).reset();

    final successMessage = 'edit_location_action_prompt'.t(
      context: context,
      args: {'count': ids.length.toString()},
    );

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: result.success
            ? successMessage
            : 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: result.success ? ToastType.success : ToastType.error,
      );
    }
  }

  void viewerAction(WidgetRef _) {
    UnimplementedError(
      "Viewer action for edit location is not implemented yet.",
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.edit_location_alt_outlined,
      label: "control_bottom_app_bar_edit_location".t(context: context),
      onPressed: () => _onTap(context, ref),
    );
  }
}
