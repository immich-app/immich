import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/components/scaffold/adaptive_route_secondary_appbar.widget.dart';

@RoutePage()
class AboutSettingsPage extends StatelessWidget {
  const AboutSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      appBar: ImAdaptiveRouteSecondaryAppBar(),
      body: Center(child: Text('About Settings')),
    );
  }
}
