import 'package:flutter/material.dart';
import 'package:crop_image/crop_image.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/hooks/crop_controller_hook.dart';
import 'edit.page.dart';
import 'package:auto_route/auto_route.dart';

/// A widget for cropping an image.
/// This widget uses [HookWidget] to manage its lifecycle and state. It allows
/// users to crop an image and then navigate to the [EditImagePage] with the
/// cropped image.

@RoutePage()
class CropImagePage extends HookWidget {
  final Image image;
  const CropImagePage({super.key, required this.image});

  @override
  Widget build(BuildContext context) {
    final cropController = useCropController();
    final aspectRatio = useState<double?>(null);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).bottomAppBarTheme.color,
        leading: CloseButton(color: Theme.of(context).iconTheme.color),
        actions: [
          IconButton(
            icon: Icon(
              Icons.done_rounded,
              color: Theme.of(context).iconTheme.color,
              size: 24,
            ),
            onPressed: () async {
              final croppedImage = await cropController.croppedImage();
              context.pushRoute(EditImageRoute(image: croppedImage));
            },
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          return Column(
            children: [
              Container(
                padding: const EdgeInsets.only(top: 20),
                width: double.infinity,
                height: constraints.maxHeight * 0.6,
                child: CropImage(
                  controller: cropController,
                  image: image,
                  gridColor: Colors.white,
                ),
              ),
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Theme.of(context).bottomAppBarTheme.color,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(
                            left: 20,
                            right: 20,
                            bottom: 10,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              IconButton(
                                icon: Icon(
                                  Icons.rotate_left,
                                  color: Theme.of(context).iconTheme.color,
                                ),
                                onPressed: () {
                                  cropController.rotateLeft();
                                },
                              ),
                              IconButton(
                                icon: Icon(
                                  Icons.rotate_right,
                                  color: Theme.of(context).iconTheme.color,
                                ),
                                onPressed: () {
                                  cropController.rotateRight();
                                },
                              ),
                            ],
                          ),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: <Widget>[
                            _AspectRatioButton(
                              cropController: cropController,
                              aspectRatio: aspectRatio,
                              ratio: null,
                              label: 'Free',
                            ),
                            _AspectRatioButton(
                              cropController: cropController,
                              aspectRatio: aspectRatio,
                              ratio: 1.0,
                              label: '1:1',
                            ),
                            _AspectRatioButton(
                              cropController: cropController,
                              aspectRatio: aspectRatio,
                              ratio: 16.0 / 9.0,
                              label: '16:9',
                            ),
                            _AspectRatioButton(
                              cropController: cropController,
                              aspectRatio: aspectRatio,
                              ratio: 3.0 / 2.0,
                              label: '3:2',
                            ),
                            _AspectRatioButton(
                              cropController: cropController,
                              aspectRatio: aspectRatio,
                              ratio: 7.0 / 5.0,
                              label: '7:5',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _AspectRatioButton extends StatelessWidget {
  final CropController cropController;
  final ValueNotifier<double?> aspectRatio;
  final double? ratio;
  final String label;

  const _AspectRatioButton({
    required this.cropController,
    required this.aspectRatio,
    required this.ratio,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    IconData iconData;
    switch (label) {
      case 'Free':
        iconData = Icons.crop_free_rounded;
        break;
      case '1:1':
        iconData = Icons.crop_square_rounded;
        break;
      case '16:9':
        iconData = Icons.crop_16_9_rounded;
        break;
      case '3:2':
        iconData = Icons.crop_3_2_rounded;
        break;
      case '7:5':
        iconData = Icons.crop_7_5_rounded;
        break;
      default:
        iconData = Icons.crop_free_rounded;
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: Icon(
            iconData,
            color: aspectRatio.value == ratio
                ? Colors.indigo
                : Theme.of(context).iconTheme.color,
          ),
          onPressed: () {
            aspectRatio.value = ratio;
            cropController.aspectRatio = ratio;
          },
        ),
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
      ],
    );
  }
}
