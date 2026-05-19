import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/utils/panorama_xmp.dart';
import 'package:immich_mobile/widgets/common/immich_loading_indicator.dart';
import 'package:openapi/api.dart';
import 'package:panorama_viewer/panorama_viewer.dart';

// One request: preview bytes are used for both XMP parsing and sphere rendering.
final _panoramaDataProvider = FutureProvider.autoDispose
    .family<({PanoramaXmpCrop? crop, Uint8List bytes}), BaseAsset>(
  (ref, asset) async {
    final String? remoteId = asset.remoteId;
    if (remoteId == null) {
      return (crop: null, bytes: Uint8List(0));
    }

    final url = Uri.parse(
      getThumbnailUrlForRemoteId(remoteId, type: AssetMediaSize.preview),
    );
    final response = await NetworkRepository.client.get(url);
    if (response.statusCode != 200 && response.statusCode != 206) {
      return (crop: null, bytes: Uint8List(0));
    }
    final bytes = response.bodyBytes;
    final crop = readPanoramaXmpFromBytes(bytes);
    return (crop: crop, bytes: bytes);
  },
);

@RoutePage()
class PanoramaViewerPage extends ConsumerStatefulWidget {
  final BaseAsset asset;

  const PanoramaViewerPage({super.key, required this.asset});

  @override
  ConsumerState<PanoramaViewerPage> createState() => _PanoramaViewerPageState();
}

class _PanoramaViewerPageState extends ConsumerState<PanoramaViewerPage> {
  SensorControl _sensorControl = SensorControl.none;
  bool _imageLoaded = false;

  void _toggleSensor() {
    setState(() {
      _sensorControl = _sensorControl == SensorControl.none
          ? SensorControl.orientation
          : SensorControl.none;
    });
  }

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dataAsync = ref.watch(_panoramaDataProvider(widget.asset));

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          dataAsync.when(
            loading: () => const Center(child: ImmichLoadingIndicator()),
            error: (_, __) => _buildViewer(crop: null, bytes: null),
            data: (d) => _buildViewer(crop: d.crop, bytes: d.bytes),
          ),
          if (dataAsync.hasValue && !_imageLoaded) const Center(child: ImmichLoadingIndicator()),
          _Overlay(
            sensorActive: _sensorControl != SensorControl.none,
            onBack: () => Navigator.of(context).pop(),
            onToggleSensor: _toggleSensor,
          ),
        ],
      ),
    );
  }

  Widget _buildViewer({required PanoramaXmpCrop? crop, required Uint8List? bytes}) {
    final ImageProvider imageProvider = bytes != null && bytes.isNotEmpty
        ? MemoryImage(bytes)
        : getFullImageProvider(widget.asset);

    final Rect area = crop?.croppedArea ?? const Rect.fromLTWH(0.0, 0.0, 1.0, 1.0);
    // GPano heading is clockwise; panorama_viewer longitude is counter-clockwise.
    final double initialLongitude = crop?.initialHeadingDegrees != null
        ? -crop!.initialHeadingDegrees!
        : (area.left + area.width / 2.0 - 0.5) * 360.0;
    final double initialLatitude = crop?.initialPitchDegrees ?? -5.0;

    final double top = area.top;
    final double height = area.height;
    final double latCap = crop != null ? 75.0 : 50.0;
    final double maxLat = (90.0 - top * 180.0).clamp(-90.0, latCap);
    final double minLat = (90.0 - (top + height) * 180.0).clamp(-latCap, 90.0);

    return PanoramaViewer(
      sensorControl: _sensorControl,
      latitude: initialLatitude,
      longitude: initialLongitude,
      sensitivity: 1.5, // default 1.0 is too slow for phone screens
      minLatitude: minLat,
      maxLatitude: maxLat,
      croppedArea: area,
      croppedFullWidth: 1.0,
      croppedFullHeight: 1.0,
      onImageLoad: () {
        if (!_imageLoaded) {
          setState(() => _imageLoaded = true);
        }
      },
      child: Image(image: imageProvider, fit: BoxFit.cover),
    );
  }
}

class _Overlay extends StatelessWidget {
  final bool sensorActive;
  final VoidCallback onBack;
  final VoidCallback onToggleSensor;

  const _Overlay({
    required this.sensorActive,
    required this.onBack,
    required this.onToggleSensor,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Stack(
        children: [
          Positioned(
            top: 8,
            left: 8,
            child: _OverlayButton(
              onTap: onBack,
              child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 22),
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: _OverlayButton(
              onTap: onToggleSensor,
              child: Icon(
                sensorActive ? Icons.screen_rotation_outlined : Icons.screen_rotation_alt_outlined,
                color: sensorActive ? Colors.white : Colors.white54,
                size: 22,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OverlayButton extends StatelessWidget {
  final VoidCallback onTap;
  final Widget child;

  const _OverlayButton({required this.onTap, required this.child});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black54,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: child,
        ),
      ),
    );
  }
}
