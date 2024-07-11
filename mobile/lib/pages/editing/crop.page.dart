import 'package:flutter/material.dart';
import 'package:crop_image/crop_image.dart';
import 'edit.page.dart';

class CropImagePage extends StatefulWidget {
  final Image image;
  const CropImagePage({super.key, required this.image});

  @override
  State<CropImagePage> createState() => _CropImagePageState();
}

class _CropImagePageState extends State<CropImagePage> {
  late CropController _cropController;
  double? _selectedAspectRatio;

  @override
  void initState() {
    super.initState();
    _cropController = CropController(
      defaultCrop: const Rect.fromLTRB(0.1, 0.1, 0.9, 0.9),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: const CloseButton(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_rounded, color: Colors.white, size: 24),
            onPressed: () async {
              final croppedImage = await _cropController.croppedImage();
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => EditImagePage(imageSource: croppedImage),
                ),
              );
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
                width: constraints.maxWidth * 0.8,
                height: constraints.maxHeight * 0.6,
                child: CropImage(
                  controller: _cropController,
                  image: widget.image,
                  gridColor: Colors.white,
                ),
              ),
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(left: 20, right: 20, bottom: 10),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.rotate_left, color: Colors.white),
                                onPressed: () {
                                  _cropController.rotateLeft();
                                },
                              ),
                              IconButton(
                                icon: const Icon(Icons.rotate_right, color: Colors.white),
                                onPressed: () {
                                  _cropController.rotateRight();
                                },
                              ),
                            ],
                          ),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: <Widget>[
                            _buildAspectRatioButton(context, null, 'Free'),
                            _buildAspectRatioButton(context, 1.0, '1:1'),
                            _buildAspectRatioButton(context, 16.0 / 9.0, '16:9'),
                            _buildAspectRatioButton(context, 3.0 / 2.0, '3:2'),
                            _buildAspectRatioButton(context, 7.0 / 5.0, '7:5'),
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

  Widget _buildAspectRatioButton(BuildContext context, double? aspectRatio, String label) {
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
            color: _selectedAspectRatio == aspectRatio ? Colors.indigo : Colors.white,
          ),
          onPressed: () => setState(() {
            _cropController.aspectRatio = aspectRatio;
            _selectedAspectRatio = aspectRatio;
          }),
        ),
        Text(label, style: const TextStyle(color: Colors.white)),
      ],
    );
  }
}
