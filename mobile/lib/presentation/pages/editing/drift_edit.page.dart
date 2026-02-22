import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:cancellation_token_http/http.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/repositories/file_media.repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/utils/image_converter.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:logging/logging.dart';
import 'package:path/path.dart' as p;

/// A stateless widget that provides functionality for editing an image.
///
/// This widget allows users to edit an image provided either as an [Asset] or
/// directly as an [Image]. It ensures that exactly one of these is provided.
///
/// It also includes a conversion method to convert an [Image] to a [Uint8List] to save the image on the user's phone
/// They automatically navigate to the [HomePage] with the edited image saved and they eventually get backed up to the server.
@immutable
@RoutePage()
class DriftEditImagePage extends ConsumerWidget {
  final BaseAsset asset;
  final Image image;
  final bool isEdited;

  const DriftEditImagePage({super.key, required this.asset, required this.image, required this.isEdited});

  void _exitEditing(BuildContext context) {
    // this assumes that the only way to get to this page is from the AssetViewerRoute
    context.navigator.popUntil((route) => route.data?.name == AssetViewerRoute.name);
  }

  Future<void> _saveEditedImage(BuildContext context, BaseAsset asset, Image image, WidgetRef ref) async {
    try {
      final Uint8List imageData = await imageToUint8List(image);
      LocalAsset? localAsset;

      try {
        localAsset = await ref
            .read(fileMediaRepositoryProvider)
            .saveLocalAsset(imageData, title: "${p.withoutExtension(asset.name)}_edited.jpg");
      } on PlatformException catch (e) {
        // OS might not return the saved image back, so we handle that gracefully
        // This can happen if app does not have full library access
        Logger("SaveEditedImage").warning("Failed to retrieve the saved image back from OS", e);
      }

      unawaited(ref.read(backgroundSyncProvider).syncLocal(full: true));
      _exitEditing(context);
      ImmichToast.show(durationInSecond: 3, context: context, msg: 'Image Saved!');

      if (localAsset == null) {
        return;
      }

      await ref.read(foregroundUploadServiceProvider).uploadManual([localAsset], CancellationToken());
    } catch (e) {
      ImmichToast.show(
        durationInSecond: 6,
        context: context,
        msg: "error_saving_image".tr(namedArgs: {'error': e.toString()}),
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text("edit".tr()),
        backgroundColor: context.scaffoldBackgroundColor,
        leading: IconButton(
          icon: Icon(Icons.close_rounded, color: context.primaryColor, size: 24),
          onPressed: () => _exitEditing(context),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: isEdited ? () => _saveEditedImage(context, asset, image, ref) : null,
            child: Text("save_to_gallery".tr(), style: TextStyle(color: isEdited ? context.primaryColor : Colors.grey)),
          ),
        ],
      ),
      backgroundColor: context.scaffoldBackgroundColor,
      body: Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: context.height * 0.7, maxWidth: context.width * 0.9),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.all(Radius.circular(7)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  spreadRadius: 2,
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: const BorderRadius.all(Radius.circular(7)),
              child: Image(image: image.image, fit: BoxFit.contain),
            ),
          ),
        ),
      ),
      bottomNavigationBar: Container(
        height: 70,
        margin: const EdgeInsets.only(bottom: 60, right: 10, left: 10, top: 10),
        decoration: BoxDecoration(
          color: context.scaffoldBackgroundColor,
          borderRadius: const BorderRadius.all(Radius.circular(30)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: <Widget>[
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                IconButton(
                  icon: Icon(Icons.crop_rotate_rounded, color: context.themeData.iconTheme.color, size: 25),
                  onPressed: () {
                    context.pushRoute(DriftCropImageRoute(asset: asset, image: image));
                  },
                ),
                Text("crop".tr(), style: context.textTheme.displayMedium),
              ],
            ),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                IconButton(
                  icon: Icon(Icons.filter, color: context.themeData.iconTheme.color, size: 25),
                  onPressed: () {
                    context.pushRoute(DriftFilterImageRoute(asset: asset, image: image));
                  },
                ),
                Text("filter".tr(), style: context.textTheme.displayMedium),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
