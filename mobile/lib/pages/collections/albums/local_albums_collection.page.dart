import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

@RoutePage()
class LocalAlbumsCollectionPage extends HookConsumerWidget {
  const LocalAlbumsCollectionPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('on_this_device'),
      ),
      body: const Center(
        child: Text('on_this_device_content'),
      ),
    );
  }
}
