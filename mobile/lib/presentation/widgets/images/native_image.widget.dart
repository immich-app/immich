import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class NativeImageView extends StatelessWidget {
  final String assetId;
  final double width;
  final double height;

  const NativeImageView({super.key, required this.assetId, required this.width, required this.height});

  @override
  Widget build(BuildContext context) {
    if (defaultTargetPlatform != TargetPlatform.iOS) {
      return Container(
        width: width,
        height: height,
        color: Colors.grey,
        child: const Center(child: Text('PHAsset view only available on iOS')),
      );
    }

    return SizedBox(
      width: width,
      height: height,
      child: UiKitView(
        viewType: 'native_image_view',
        layoutDirection: TextDirection.ltr,
        creationParams: {'assetId': assetId},
        creationParamsCodec: const StandardMessageCodec(),
        gestureRecognizers: <Factory<OneSequenceGestureRecognizer>>{
          Factory<VerticalDragGestureRecognizer>(() => VerticalDragGestureRecognizer()),
          Factory<HorizontalDragGestureRecognizer>(() => HorizontalDragGestureRecognizer()),
          Factory<ScaleGestureRecognizer>(() => ScaleGestureRecognizer()),
        },
      ),
    );
  }
}
