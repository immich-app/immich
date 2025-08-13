import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/map/map.widget.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

@RoutePage()
class DriftMapPage extends StatelessWidget {
  final LatLng? initialLocation;

  const DriftMapPage({super.key, this.initialLocation});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          DriftMap(initialLocation: initialLocation),
          Positioned(
            left: 16,
            top: 60,
            child: IconButton.filled(
              color: Colors.white,
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              style: IconButton.styleFrom(
                shape: const CircleBorder(side: BorderSide(width: 1, color: Colors.black26)),
                padding: const EdgeInsets.all(8),
                backgroundColor: Colors.indigo.withValues(alpha: 0.7),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
