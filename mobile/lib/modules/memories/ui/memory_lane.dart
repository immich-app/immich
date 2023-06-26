import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/memories/providers/memory.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class MemoryLane extends HookConsumerWidget {
  const MemoryLane({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memoryLaneFutureProvider = ref.watch(memoryFutureProvider);

    final memoryLane = memoryLaneFutureProvider
        .whenData(
          (memories) => memories != null
              ? SizedBox(
                  height: 200,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    shrinkWrap: true,
                    itemCount: memories.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: GestureDetector(
                          onTap: () {
                            AutoRouter.of(context)
                                .push(const VerticalRouteView());
                          },
                          child: SizedBox(
                            height: 200,
                            width: 150,
                            child: Card(
                              child: Center(
                                child: Text(memories[index].title),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                )
              : const SizedBox(),
        )
        .value;

    return memoryLane ?? const SizedBox();
  }
}
