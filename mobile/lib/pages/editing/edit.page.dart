import 'dart:io';
import 'dart:typed_data';
import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/widgets/common/immich_image.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:auto_route/auto_route.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';

/// A stateless widget that provides functionality for editing an image.
///
/// This widget allows users to edit an image provided either as an [Asset] or
/// directly as an [Image]. It ensures that exactly one of these is provided.
///
/// It also includes a conversion method to convert an [Image] to a [Uint8List] to save the image on the user's phone
/// They automatically navigate to the [HomePage] with the edited image saved and they eventually get backed up to the server.
@immutable
@RoutePage()
class EditImagePage extends ConsumerWidget {
  final Asset? asset;
  final Image? image;

  const EditImagePage({
    super.key,
    this.image,
    this.asset,
  }) : assert(
          (image != null && asset == null) || (image == null && asset != null),
          'Must supply one of asset or image',
        );

  Future<Uint8List> _imageToUint8List(Image image) async {
    final Completer<Uint8List> completer = Completer();
    image.image.resolve(const ImageConfiguration()).addListener(
          ImageStreamListener(
            (ImageInfo info, bool _) {
              info.image
                  .toByteData(format: ImageByteFormat.png)
                  .then((byteData) {
                if (byteData != null) {
                  completer.complete(byteData.buffer.asUint8List());
                } else {
                  completer.completeError('Failed to convert image to bytes');
                }
              });
            },
            onError: (exception, stackTrace) =>
                completer.completeError(exception),
          ),
        );
    return completer.future;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ImageProvider provider = (asset != null)
        ? ImmichImage.imageProvider(asset: asset!)
        : (image != null)
            ? image!.image
            : throw Exception('Invalid image source type');

    final Image imageWidget = (asset != null)
        ? Image(image: ImmichImage.imageProvider(asset: asset!))
        : (image != null)
            ? image!
            : throw Exception('Invalid image source type');

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        leading: IconButton(
          icon: Icon(
            Icons.close_rounded,
            color: Theme.of(context).iconTheme.color,
            size: 24,
          ),
          onPressed: () =>
              Navigator.of(context).popUntil((route) => route.isFirst),
        ),
        actions: <Widget>[
          if (image != null)
            TextButton(
              onPressed: () async {
                try {
                  final Uint8List imageData = await _imageToUint8List(image!);
                  ImmichToast.show(
                    durationInSecond: 3,
                    context: context,
                    msg: 'Image Saved!',
                    gravity: ToastGravity.CENTER,
                  );

                  await PhotoManager.editor
                      .saveImage(imageData, title: "_edited.jpg");
                  await ref.read(albumProvider.notifier).getDeviceAlbums();
                  Navigator.of(context).popUntil((route) => route.isFirst);
                } catch (e) {
                  ImmichToast.show(
                    durationInSecond: 6,
                    context: context,
                    msg: 'Error: ${e.toString()}',
                    gravity: ToastGravity.BOTTOM,
                  );
                }
              },
              child: Text(
                'Save to gallery',
                style: Theme.of(context).textTheme.displayMedium,
              ),
            ),
        ],
      ),
      body: Column(
        children: <Widget>[
          Expanded(
            child: Image(image: provider),
          ),
          Container(
            height: 80,
            color: Theme.of(context).bottomAppBarTheme.color,
          ),
        ],
      ),
      bottomNavigationBar: Container(
        height: 80,
        margin: const EdgeInsets.only(bottom: 20, right: 10, left: 10, top: 10),
        decoration: BoxDecoration(
          color: Theme.of(context).bottomAppBarTheme.color,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            IconButton(
              icon: Icon(
                Platform.isAndroid
                    ? Icons.crop_rotate_rounded
                    : Icons.crop_rotate_rounded,
                color: Theme.of(context).iconTheme.color,
              ),
              onPressed: () {
                context.pushRoute(CropImageRoute(image: imageWidget));
              },
            ),
            Text('Crop', style: Theme.of(context).textTheme.displayMedium),
          ],
        ),
      ),
    );
  }
}
