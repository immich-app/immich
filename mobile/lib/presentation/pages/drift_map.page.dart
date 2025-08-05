import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/widgets/map/map.widget.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

@RoutePage()
class DriftMapPage extends StatelessWidget {
  final LatLng? initialLocation;

  const DriftMapPage({super.key, this.initialLocation});

  @override
  Widget build(BuildContext context) {
    return Scaffold(extendBodyBehindAppBar: true, body: DriftMap(initialLocation: initialLocation));
  }
}
