// 360° panoramas, ported from web. Kept in one file on purpose: existing code
// changes by a few lines, no new dependencies or shared components.

import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart';
import 'package:openapi/api.dart';

// Aligned with web: https://github.com/immich-app/immich/blob/main/web/src/lib/components/asset-viewer/AssetViewer.svelte
bool isPanorama(WidgetRef ref, BaseAsset asset) =>
    ref.watch(assetExifProvider(asset).select((s) => s.valueOrNull?.projectionType)) == ProjectionType.equirectangular;

/// Opens [PanoramaViewerPage]; shown only on equirectangular photos.
class PanoramaButton extends ConsumerWidget {
  final BaseAsset asset;
  // Follows the photo while it is dragged
  final PhotoViewControllerBase? controller;

  const PanoramaButton({super.key, required this.asset, this.controller});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!isPanorama(ref, asset)) {
      return const SizedBox.shrink();
    }

    final viewport = MediaQuery.sizeOf(context);
    final button = Center(
      child: IconButton.filled(
        style: IconButton.styleFrom(backgroundColor: Colors.black45, foregroundColor: Colors.white),
        iconSize: 36,
        icon: const Icon(Icons.threesixty_rounded),
        onPressed: () => context.pushRoute(PanoramaViewerRoute(asset: asset)),
      ),
    );
    final controller = this.controller;
    final following = controller == null
        ? button
        : StreamBuilder(
            stream: controller.outputStateStream,
            initialData: controller.value,
            builder: (_, snapshot) => Transform.translate(offset: snapshot.requireData.position, child: button),
          );
    // Hidden while the viewer is opening or closing, the button is not part of the hero
    final transition = ModalRoute.of(context)?.animation;
    return Positioned(
      width: viewport.width,
      height: viewport.height,
      child: transition == null
          ? following
          : AnimatedBuilder(
              animation: transition,
              builder: (_, child) => transition.isCompleted ? child! : const SizedBox.shrink(),
              child: following,
            ),
    );
  }
}

/// Full-screen viewer for equirectangular (360°) photos: drag to look around, pinch to zoom.
@RoutePage()
class PanoramaViewerPage extends StatefulWidget {
  final BaseAsset asset;

  const PanoramaViewerPage({super.key, required this.asset});

  @override
  State<PanoramaViewerPage> createState() => _PanoramaViewerPageState();
}

class _PanoramaViewerPageState extends State<PanoramaViewerPage> {
  ImageStream? _imageStream;
  ImageInfo? _imageInfo;
  // Part of the full sphere the image covers, normalised to [0, 1]
  Rect _crop = const Rect.fromLTWH(0, 0, 1, 1);

  // View direction and vertical field of view, in degrees
  double _longitude = 0;
  double _latitude = 0;
  double _fov = 90;
  double _fovAtScaleStart = 90;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_imageStream == null) {
      _imageStream = getFullImageProvider(
        widget.asset,
        size: MediaQuery.sizeOf(context),
      ).resolve(ImageConfiguration.empty)..addListener(ImageStreamListener(_onImage));
      _loadCrop().ignore();
    }
  }

  // Partial spheres: the server copies the GPano crop into the preview's XMP (same source as web)
  Future<void> _loadCrop() async {
    final remoteId = widget.asset.remoteId;
    if (remoteId == null) {
      return;
    }
    final String xmp;
    try {
      final url = getThumbnailUrlForRemoteId(remoteId, type: AssetMediaSize.preview);
      xmp = latin1.decode((await NetworkRepository.client.get(Uri.parse(url))).bodyBytes);
    } catch (_) {
      return; // keep the full sphere
    }
    double? tag(String name) => double.tryParse(RegExp('GPano:$name(?:="|>)([0-9.]+)').firstMatch(xmp)?.group(1) ?? '');
    final fullWidth = tag('FullPanoWidthPixels');
    final fullHeight = tag('FullPanoHeightPixels');
    final left = tag('CroppedAreaLeftPixels');
    final top = tag('CroppedAreaTopPixels');
    final width = tag('CroppedAreaImageWidthPixels');
    final height = tag('CroppedAreaImageHeightPixels');
    if (fullWidth == null || fullHeight == null || left == null || top == null || width == null || height == null) {
      return;
    }
    if (mounted) {
      setState(() => _crop = Rect.fromLTWH(left / fullWidth, top / fullHeight, width / fullWidth, height / fullHeight));
    }
  }

  @override
  void dispose() {
    _imageStream?.removeListener(ImageStreamListener(_onImage));
    _imageInfo?.dispose();
    super.dispose();
  }

  // Called for every image the provider yields (thumbnail, preview, original)
  void _onImage(ImageInfo imageInfo, bool _) {
    _imageInfo?.dispose();
    setState(() => _imageInfo = imageInfo);
  }

  void _onScaleUpdate(ScaleUpdateDetails details) {
    setState(() {
      _fov = (_fovAtScaleStart / details.scale).clamp(15.0, 115.0);
      // Rotate by the angle the dragged distance covers on screen, so the image follows the finger
      final degreesPerPixel = _fov / context.size!.height;
      _longitude -= details.focalPointDelta.dx * degreesPerPixel;
      _latitude = (_latitude + details.focalPointDelta.dy * degreesPerPixel).clamp(-90.0, 90.0);
    });
  }

  @override
  Widget build(BuildContext context) {
    final image = _imageInfo?.image;

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(backgroundColor: Colors.transparent, foregroundColor: Colors.white, leading: const CloseButton()),
      body: image == null
          ? null
          : GestureDetector(
              behavior: HitTestBehavior.opaque,
              onScaleStart: (_) => _fovAtScaleStart = _fov,
              onScaleUpdate: _onScaleUpdate,
              child: CustomPaint(
                painter: _SpherePainter(
                  image: image,
                  crop: _crop,
                  longitude: _longitude,
                  latitude: _latitude,
                  fov: _fov,
                ),
                size: Size.infinite,
              ),
            ),
    );
  }
}

/// Paints a sphere textured with an equirectangular image, as seen from its centre.
class _SpherePainter extends CustomPainter {
  static const _rows = 32;
  static const _columns = 64;
  static const _vertexCount = (_rows + 1) * (_columns + 1);

  // Vertices further than ~80° from the view direction are off screen
  static const _minDepth = 0.15;

  final ui.Image image;
  final Rect crop;
  final double longitude;
  final double latitude;
  final double fov;

  const _SpherePainter({
    required this.image,
    required this.crop,
    required this.longitude,
    required this.latitude,
    required this.fov,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final yaw = longitude * math.pi / 180;
    final cosPitch = math.cos(latitude * math.pi / 180);
    final sinPitch = math.sin(latitude * math.pi / 180);
    final focalLength = size.height / 2 / math.tan(fov * math.pi / 360);
    final center = size.center(Offset.zero);

    // Project the vertices of a sphere mesh onto the canvas
    final positions = Float32List(_vertexCount * 2);
    final textureCoordinates = Float32List(_vertexCount * 2);
    final depths = Float32List(_vertexCount);
    for (var i = 0; i < _vertexCount; i++) {
      final row = i ~/ (_columns + 1);
      final column = i % (_columns + 1);
      final elevation = math.pi / 2 - math.pi * (crop.top + crop.height * row / _rows);
      final azimuth = 2 * math.pi * (crop.left + crop.width * column / _columns - 0.5) - yaw;
      final x = math.cos(elevation) * math.sin(azimuth);
      final y = math.sin(elevation) * cosPitch - math.cos(elevation) * math.cos(azimuth) * sinPitch;
      final depth = math.sin(elevation) * sinPitch + math.cos(elevation) * math.cos(azimuth) * cosPitch;

      depths[i] = depth;
      positions[i * 2] = center.dx + focalLength * x / depth;
      positions[i * 2 + 1] = center.dy - focalLength * y / depth;
      textureCoordinates[i * 2] = image.width * column / _columns;
      textureCoordinates[i * 2 + 1] = image.height * row / _rows;
    }

    // Keep only the triangles in front of the viewer
    final indices = Uint16List(_rows * _columns * 6);
    var indexCount = 0;
    for (var row = 0; row < _rows; row++) {
      for (var column = 0; column < _columns; column++) {
        final topLeft = row * (_columns + 1) + column;
        final corners = [topLeft, topLeft + 1, topLeft + _columns + 1, topLeft + _columns + 2];
        if (corners.any((corner) => depths[corner] < _minDepth)) {
          continue;
        }
        indices.setAll(indexCount, [corners[0], corners[1], corners[2], corners[1], corners[3], corners[2]]);
        indexCount += 6;
      }
    }

    final paint = Paint()
      ..shader = ImageShader(
        image,
        TileMode.clamp,
        TileMode.clamp,
        Matrix4.identity().storage,
        filterQuality: FilterQuality.medium,
      );
    canvas.drawVertices(
      ui.Vertices.raw(
        ui.VertexMode.triangles,
        positions,
        textureCoordinates: textureCoordinates,
        indices: Uint16List.sublistView(indices, 0, indexCount),
      ),
      BlendMode.srcOver,
      paint,
    );
  }

  // Only rebuilt on gesture or image changes
  @override
  bool shouldRepaint(_SpherePainter oldDelegate) => true;
}
