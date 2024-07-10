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
              Image croppedImage = await _cropController.croppedImage();;
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
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.only(top: 20),
            width: MediaQuery.of(context).size.width * 0.8,
            height: MediaQuery.of(context).size.height * 0.6,
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
                    padding:
                        const EdgeInsets.only(left: 20, right: 20, bottom: 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.rotate_left,
                              color: Colors.white),
                          onPressed: () {
                            _cropController.rotateLeft();
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.rotate_right,
                              color: Colors.white),
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
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                              icon: Icon(Icons.crop_free_rounded,
                                  color: _selectedAspectRatio == null
                                      ? Colors.blue
                                      : Colors.white),
                              onPressed: () => setState(() {
                                    _cropController.aspectRatio = null;
                                    _selectedAspectRatio = null;
                                  })),
                          const Text('Free',
                              style: TextStyle(color: Colors.white)),
                        ],
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                              icon: Icon(Icons.crop_square_rounded,
                                  color: _selectedAspectRatio == 1
                                      ? Colors.blue
                                      : Colors.white),
                              onPressed: () => setState(() {
                                    _cropController.aspectRatio = 1;
                                    _selectedAspectRatio = 1;
                                  })),
                          const Text('1:1',
                              style: TextStyle(color: Colors.white)),
                        ],
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                              icon: Icon(Icons.crop_16_9_rounded,
                                  color: _selectedAspectRatio == 16 / 9
                                      ? Colors.blue
                                      : Colors.white),
                              onPressed: () => setState(() {
                                    _cropController.aspectRatio = 16 / 9;
                                    _selectedAspectRatio = 16 / 9;
                                  })),
                          const Text('16:9',
                              style: TextStyle(color: Colors.white)),
                        ],
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                              icon: Icon(Icons.crop_3_2_rounded,
                                  color: _selectedAspectRatio == 3 / 2
                                      ? Colors.blue
                                      : Colors.white),
                              onPressed: () => setState(() {
                                    _cropController.aspectRatio = 3 / 2;
                                    _selectedAspectRatio = 3 / 2;
                                  })),
                          const Text('3:2',
                              style: TextStyle(color: Colors.white)),
                        ],
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                              icon: Icon(Icons.crop_7_5_rounded,
                                  color: _selectedAspectRatio == 7 / 5
                                      ? Colors.blue
                                      : Colors.white),
                              onPressed: () => setState(() {
                                    _cropController.aspectRatio = 7 / 5;
                                    _selectedAspectRatio = 7 / 5;
                                  })),
                          const Text('7:5',
                              style: TextStyle(color: Colors.white)),
                        ],
                      ),
                    ],
                  ),
                ],
              )),
            ),
          ),
        ],
      ),
    );
  }
}
