import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/services/sync.service.dart';
import 'package:immich_mobile/presentation/modules/common/states/current_user.state.dart';
import 'package:immich_mobile/service_locator.dart';

@RoutePage()
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ElevatedButton(
        onPressed: () => di<SyncService>()
            .doFullSyncForUserDrift(di<CurrentUserCubit>().state),
        child: const Text('Sync'),
      ),
    );
  }
}
