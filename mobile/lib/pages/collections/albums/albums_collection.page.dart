import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

@RoutePage()
class AlbumsCollectionPage extends HookConsumerWidget {
  const AlbumsCollectionPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('albums_collection_page_title'),
      ),
      body: const Center(
        child: Text('albums_collection_page_content'),
      ),
    );
  }
}
