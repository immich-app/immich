import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';
import 'package:immich_mobile/modules/search/providers/people.provider.dart';

class PersonResultPage extends HookConsumerWidget {
  final String personId;
  final String personName;

  const PersonResultPage({
    super.key,
    required this.personId,
    required this.personName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          personName,
          style: const TextStyle(
            fontSize: 16.0,
          ),
        ),
        leading: IconButton(
          onPressed: () => AutoRouter.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
      ),
      body: ref.watch(personAssetsProvider(personId)).when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stackTrace) => Center(child: Text(error.toString())),
            data: (data) => data.isEmpty
                ? const Center(
                    child: Text('Opps'),
                  )
                : Stack(
                    children: [
                      ImmichAssetGrid(
                        renderList: data,
                      ),
                    ],
                  ),
          ),
    );
  }
}
