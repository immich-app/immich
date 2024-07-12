import 'dart:io';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:immich_mobile/pages/editing/crop.page.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/widgets/common/immich_image.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

@immutable
class EditImagePage extends StatelessWidget {
  final Asset? asset;
  final Image? image;

  const EditImagePage({
    super.key,
    this.image,
    this.asset,
  }) : assert(
            (image != null && asset == null) ||
                (image == null && asset != null),
            'Must supply one of asset or image');


  @override
  Widget build(BuildContext context) {
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
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: Colors.white, size: 24),
          onPressed: () =>
              Navigator.of(context).popUntil((route) => route.isFirst),
        ),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.done_rounded, color: Colors.white, size: 24),
            onPressed: () async {
              if (image == null) {
                ImmichToast.show(
                  durationInSecond: 1,
                  context: context,
                  msg: 'No edits made!',
                  gravity: ToastGravity.BOTTOM,
                );
              } else {
              }
            },
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
            color: Colors.black,
          ),
        ],
      ),
      bottomNavigationBar: Container(
        height: 60,
        margin: const EdgeInsets.only(bottom: 50, right: 10, left: 10, top: 10),
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: <Widget>[
            IconButton(
              icon: Icon(
                Platform.isAndroid
                    ? Icons.crop_rotate_rounded
                    : Icons.crop_rotate_rounded,
                color: Colors.white,
              ),
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => CropImagePage(image: imageWidget),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
