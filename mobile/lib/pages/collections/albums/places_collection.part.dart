import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

@RoutePage()
class PlacesCollectionPage extends HookConsumerWidget {
  const PlacesCollectionPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('places'),
      ),
      body: const Center(
        child: Text('places'),
      ),
    );
  }
}
