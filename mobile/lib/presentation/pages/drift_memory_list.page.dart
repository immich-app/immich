import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/pages/drift_memory.page.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/routing/router.dart';

@RoutePage()
class DriftMemoryListPage extends ConsumerStatefulWidget {
  const DriftMemoryListPage({super.key});

  @override
  ConsumerState<DriftMemoryListPage> createState() => _DriftMemoryListPageState();
}

class _DriftMemoryListPageState extends ConsumerState<DriftMemoryListPage> {
  bool _onlyFavorites = false;

  @override
  Widget build(BuildContext context) {
    final memories = ref.watch(driftAllMemoriesProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        return Scaffold(
          appBar: AppBar(
            title: Text('memories'.tr()),
            actions: [
              IconButton(
                icon: Icon(_onlyFavorites ? Icons.favorite : Icons.favorite_outline),
                onPressed: () {
                  setState(() => _onlyFavorites = !_onlyFavorites);
                },
              ),
            ],
          ),
          body: SafeArea(
            child: memories.when(
              data: (memories) {
                if (_onlyFavorites) {
                  memories = memories.where((memory) => memory.isSaved).toList();
                }

                return GridView.builder(
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: constraints.maxWidth > 600 ? 4 : 2,
                    childAspectRatio: 0.5625,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                  ),
                  padding: const EdgeInsets.all(16),
                  itemCount: memories.length,
                  itemBuilder: (context, index) => GestureDetector(
                    onTap: () {
                      if (memories[index].assets.isNotEmpty) {
                        DriftMemoryPage.setMemory(ref, memories[index]);
                      }
                      context.pushRoute(DriftMemoryRoute(memories: memories, memoryIndex: index));
                    },
                    child: Stack(
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.all(Radius.circular(10)),
                          child: ColorFiltered(
                            colorFilter: ColorFilter.mode(Colors.black.withValues(alpha: 0.2), BlendMode.darken),
                            child: AbsorbPointer(
                              child: Thumbnail.remote(
                                remoteId: memories[index].assets[0].id,
                                thumbhash: memories[index].assets[0].thumbHash ?? "",
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 16,
                          left: 16,
                          child: Text(
                            DateFormat.yMMMMd().format(memories[index].memoryAt),
                            style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 15),
                          ),
                        ),
                        if (memories[index].isSaved)
                          const Positioned(
                            top: 16,
                            right: 16,
                            child: Icon(Icons.favorite, color: Colors.white, size: 24),
                          ),
                      ],
                    ),
                  ),
                );
              },
              error: (error, stack) => const Text("Error loading memories"),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        );
      },
    );
  }
}
