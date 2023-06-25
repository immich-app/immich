import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/views/vertical_page_view.dart';
import 'package:immich_mobile/routing/router.dart';

class MemoryLane extends HookConsumerWidget {
  const MemoryLane({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = [
      Colors.red,
      Colors.blue,
      Colors.green,
      Colors.yellow,
      Colors.purple
    ];
    return SizedBox(
      height: 150,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        shrinkWrap: true,
        itemCount: 5,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.all(8.0),
            child: GestureDetector(
              onTap: () {
                AutoRouter.of(context).push(const VerticalRouteView());
              },
              child: Container(
                height: 100,
                width: 200,
                color: colors[index],
              ),
            ),
          );
        },
      ),
    );
  }
}
