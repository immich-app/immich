import 'dart:async';
import 'dart:ui';

import 'package:auto_route/auto_route.dart';
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
import 'package:immich_mobile/services/upload.service.dart';
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
  Future<Uint8List> _imageToUint8List(Image image) async {
    final Completer<Uint8List> completer = Completer();
    image.image
        .resolve(const ImageConfiguration())
        .addListener(
          ImageStreamListener((ImageInfo info, bool _) {
            info.image.toByteData(format: ImageByteFormat.png).then((byteData) {
              if (byteData != null) {
                completer.complete(byteData.buffer.asUint8List());
              } else {
                completer.completeError('Failed to convert image to bytes');
              }
            });
          }, onError: (exception, stackTrace) => completer.completeError(exception)),
        );
    return completer.future;
  }

  Future<void> _saveEditedImage(BuildContext context, BaseAsset asset, Image image, WidgetRef ref) async {
    try {
      final Uint8List imageData = await _imageToUint8List(image);
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

      ref.read(backgroundSyncProvider).syncLocal(full: true);
      context.navigator.popUntil((route) => route.isFirst);
      ImmichToast.show(durationInSecond: 3, context: context, msg: 'Image Saved!');

      if (localAsset == null) {
        return;
      }

      await ref.read(uploadServiceProvider).manualBackup([localAsset]);
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
          onPressed: () => context.navigator.popUntil((route) => route.isFirst),
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
