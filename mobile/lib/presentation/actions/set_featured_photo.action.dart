import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/people.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

class SetFeaturedPhotoAction extends ActionBuilder {
  final String assetId;
  final String personId;

  const SetFeaturedPhotoAction({required this.assetId, required this.personId});

  @override
  ActionItem create(BuildContext context, WidgetRef ref) => .new(
    icon: Icons.face_outlined,
    label: context.t.set_as_featured_photo,
    onAction: () => _setFeaturedPhoto(context, ref),
  );

  Future<void> _setFeaturedPhoto(BuildContext context, WidgetRef ref) async {
    final message = context.t.feature_photo_updated;
    final peopleService = ref.read(peopleServiceProvider);
    final toastService = ref.read(toastServiceProvider);

    try {
      await peopleService.setFeaturedPhoto(personId, assetId);
      toastService.success(message);
    } catch (error, stack) {
      handleError(error, stack: stack, description: "Failed to set featured photo");
    }
  }
}
