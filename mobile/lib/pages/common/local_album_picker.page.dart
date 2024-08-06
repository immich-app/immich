import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

@RoutePage()
class LocalAlbumPickerPage extends ConsumerWidget {
  const LocalAlbumPickerPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select local album'),
        centerTitle: false,
      ),
      body: ListView(
        children: [
          ListTile(
            title: const Text('Album 1'),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Album 2'),
            onTap: () {},
          ),
          ListTile(
            title: const Text('Album 3'),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}
