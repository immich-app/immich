import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class VerticalPageView extends HookConsumerWidget {
  const VerticalPageView({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final verticalPageController = usePageController();
    final horizontalPageController1 = usePageController();
    final horizontalPageController2 = usePageController();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vertical Page View'),
      ),
      body: PageView(
        scrollDirection: Axis.vertical,
        controller: verticalPageController,
        onPageChanged: (value) => print("Change to memory lane $value"),
        children: [
          PageView(
            controller: horizontalPageController1,
            children: const [
              SizedBox(
                height: 100,
                width: 100,
                child: Text("Page 1 - 1"),
              ),
              SizedBox(
                height: 100,
                width: 100,
                child: Text("Page 1 - 2"),
              ),
            ],
          ),
          PageView(
            controller: horizontalPageController2,
            children: const [
              SizedBox(
                height: 100,
                width: 100,
                child: Text("Page 2 - 1"),
              ),
              SizedBox(
                height: 100,
                width: 100,
                child: Text("Page 2 - 2"),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
