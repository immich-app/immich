import 'package:flutter/material.dart';
import 'package:panorama_viewer/panorama_viewer.dart';

class PhotoSphereView extends StatefulWidget {
  const PhotoSphereView({super.key, required this.toggleControls, required this.imageProvider});

  final ImageProvider<Object> imageProvider;
  final void Function() toggleControls;

  @override
  State<PhotoSphereView> createState() => _PhotoSphereViewState();
}

class _PhotoSphereViewState extends State<PhotoSphereView> {
  SensorControl sensorControl = SensorControl.none;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        PanoramaViewer(
          key: ValueKey(sensorControl),
          interactive: true,
          sensorControl: sensorControl,
          child: Image(
            image: widget.imageProvider,
            fit: BoxFit.cover,
            gaplessPlayback: true,
            filterQuality: FilterQuality.high,
          ),
        ),
        Positioned(
          top: 16,
          left: 16,
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => widget.toggleControls(),
          ),
        ),
        Positioned(
          top: 16,
          right: 16,
          child: IconButton(
            icon: Icon(
              sensorControl == SensorControl.none ? Icons.screen_rotation : Icons.screen_lock_rotation,
              color: Colors.white,
            ),
            onPressed: () => setState(() {
              sensorControl = sensorControl == SensorControl.none ? SensorControl.orientation : SensorControl.none;
            }),
          ),
        ),
      ],
    );
  }
}
