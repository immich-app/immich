import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/widgets/map/map.widget.dart';

@RoutePage()
class DriftMapPage extends StatelessWidget {
  const DriftMapPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      extendBodyBehindAppBar: true,
      body: DriftMapWithMarker(),
    );
  }
}
