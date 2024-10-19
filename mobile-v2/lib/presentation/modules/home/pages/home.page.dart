import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/utils/renderlist_providers.dart';
import 'package:immich_mobile/presentation/components/grid/immich_asset_grid.state.dart';
import 'package:immich_mobile/presentation/components/grid/immich_asset_grid.widget.dart';

@RoutePage()
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocProvider(
        create: (_) => AssetGridCubit(
          renderListProvider: RenderListProvider.mainTimeline(),
        ),
        child: const ImAssetGrid(),
      ),
    );
  }
}
