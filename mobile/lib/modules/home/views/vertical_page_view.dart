import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class VerticalPageView extends HookConsumerWidget {
  const VerticalPageView({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pageController = usePageController();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vertical Page View'),
      ),
      body: PageView(
        controller: pageController,
        children: [
          Center(
            child: Container(
              height: 100,
              width: 100,
              color: Colors.red,
            ),
          ),
          Center(
            child: Container(
              height: 100,
              width: 100,
              color: Colors.blue,
            ),
          ),
          Center(
            child: Container(
              height: 100,
              width: 100,
              color: Colors.green,
            ),
          ),
          Center(
            child: Container(
              height: 100,
              width: 100,
              color: Colors.yellow,
            ),
          ),
          Center(
            child: Container(
              height: 100,
              width: 100,
              color: Colors.purple,
            ),
          ),
        ],
      ),
    );
  }
}
