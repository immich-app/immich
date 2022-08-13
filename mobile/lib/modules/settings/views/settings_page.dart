import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SettingsPage extends HookConsumerWidget {
  const SettingsPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          iconSize: 20,
          splashRadius: 24,
          onPressed: () {
            Navigator.pop(context);
          },
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        automaticallyImplyLeading: false,
        centerTitle: false,
        title: const Text(
          'Settings',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        children: [
          ...ListTile.divideTiles(
            context: context,
            tiles: [
              ListTile(
                dense: true,
                title: const Text('Image viewer quality'),
                subtitle: const Text('Adjust the quality of the image viewer'),
                trailing: const Icon(
                  Icons.keyboard_arrow_right_rounded,
                  size: 24,
                ),
                onTap: () {},
              ),
              ListTile(
                dense: true,
                title: const Text('Theme'),
                subtitle: const Text('Choose between light and dark theme'),
                trailing: const Icon(
                  Icons.keyboard_arrow_right_rounded,
                  size: 24,
                ),
                onTap: () {},
              ),
            ],
          ).toList(),
        ],
      ),
    );
  }
}
