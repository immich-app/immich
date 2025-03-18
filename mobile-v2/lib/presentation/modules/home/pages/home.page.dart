import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:immich_mobile/domain/utils/renderlist_providers.dart';
import 'package:immich_mobile/presentation/components/appbar/app_bar.widget.dart';
import 'package:immich_mobile/presentation/components/grid/asset_grid.state.dart';
import 'package:immich_mobile/presentation/components/grid/asset_grid.widget.dart';
import 'package:immich_mobile/utils/extensions/build_context.extension.dart';

@RoutePage()
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _showAppBar = ValueNotifier<bool>(true);

  @override
  void dispose() {
    _showAppBar.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocProvider(
        create: (_) => AssetGridCubit(
          renderListProvider: RenderListProvider.mainTimeline(),
        ),
        child: Stack(children: [
          ImmichAssetGridView(),
          if (!context.isTablet)
            ValueListenableBuilder(
              valueListenable: _showAppBar,
              builder: (_, shouldShow, appBar) {
                final Duration duration;
                if (shouldShow) {
                  // Animate out app bar slower
                  duration = Durations.short3;
                } else {
                  // Animate in app bar faster
                  duration = Durations.medium2;
                }
                return AnimatedPositioned(
                  left: 0,
                  top: shouldShow
                      ? 0
                      : -(kToolbarHeight + context.mediaQueryPadding.top),
                  right: 0,
                  curve: Curves.easeOut,
                  duration: duration,
                  child: appBar!,
                );
              },
              child: const ImAppBar(),
            ),
        ]),
      ),
    );
  }
}
