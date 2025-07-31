import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/remote_shared_album.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/shared_link.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
// ignore: import_rule_openapi
import 'package:openapi/api.dart';

@RoutePage()
class RemoteSharedLinkPage extends ConsumerStatefulWidget {
  final String shareKey;
  final String endpoint;

  const RemoteSharedLinkPage({super.key, required this.shareKey, required this.endpoint});

  @override
  ConsumerState<RemoteSharedLinkPage> createState() => _RemoteSharedLinkPageState();
}

class _RemoteSharedLinkPageState extends ConsumerState<RemoteSharedLinkPage> {
  late final ApiService _apiService;

  SharedLink? sharedLink;
  List<RemoteAsset>? assets;

  @override
  void initState() {
    super.initState();

    String endpoint = widget.endpoint;
    if (!endpoint.endsWith('/api')) {
      endpoint += '/api';
    }
    ImageUrlBuilder.setHost(endpoint);
    ImageUrlBuilder.setParameter('key', widget.shareKey);
    _apiService = ApiService.shared(endpoint, widget.shareKey);

    retrieveSharedLink();
  }

  @override
  void dispose() {
    ImageUrlBuilder.clear();
    super.dispose();
  }

  Future<void> retrieveSharedLink() async {
    try {
      sharedLink = await SharedLinkService(_apiService).getMySharedLink();
    } on ApiException catch (error, _) {
      if (error.code == 401) {
        // We need a password from user.
        // TODO: make password input and try to auth again
      }
    }

    if (sharedLink == null) {
      ImmichToast.show(
        context: context,
        msg: "shared_link_not_found".t(context: context),
        toastType: ToastType.error,
      );
      context.pop();
      return;
    }

    // Retrieve assets from the shared link
    switch (sharedLink!.type) {
      case SharedLinkSource.album:
        assets = await retrieveSharedAlbumAssets();
        break;
      case SharedLinkSource.individual:
        assets = sharedLink!.assets;
        break;
    }

    // if (assets!.isEmpty) {
    //   context.pop();
    // }

    setState(() {});
  }

  Future<List<RemoteAsset>> retrieveSharedAlbumAssets() async {
    try {
      final driftApiRepository = DriftAlbumApiRepository(_apiService.albumsApi);
      final albumService = RemoteSharedAlbumService(driftApiRepository);
      final sharedAlbum = await albumService.getSharedAlbum(sharedLink!.albumId!);

      return sharedAlbum?.assets ?? [];
    } catch (e) {
      ImmichToast.show(
        context: context,
        msg: "failed_to_retrieve_assets".t(context: context),
        toastType: ToastType.error,
      );
      return [];
    }
  }

  Future<void> addAssets(BuildContext context) async {
    // TODO add upload assets to shared album
  }

  void showOptionSheet(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    // showModalBottomSheet(
    //   context: context,
    //   backgroundColor: context.colorScheme.surface,
    //   isScrollControlled: false,
    //   builder: (context) {
    //     return DriftRemoteAlbumOption(
    //       onDeleteAlbum: isOwner
    //           ? () async {
    //               await deleteAlbum(context);
    //               if (context.mounted) {
    //                 context.pop();
    //               }
    //             }
    //           : null,
    //       onAddUsers: isOwner
    //           ? () async {
    //               await addUsers(context);
    //               context.pop();
    //             }
    //           : null,
    //       onAddPhotos: () async {
    //         await addAssets(context);
    //         context.pop();
    //       },
    //       onToggleAlbumOrder: () async {
    //         await toggleAlbumOrder();
    //         context.pop();
    //       },
    //       onEditAlbum: () async {
    //         context.pop();
    //         await showEditTitleAndDescription(context);
    //       },
    //     );
    //   },
    // );
  }

  @override
  Widget build(BuildContext context) {
    if (assets == null || assets!.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return ProviderScope(
      overrides: [
        apiServiceProvider.overrideWith((ref) => _apiService),
        timelineServiceProvider.overrideWith((ref) {
          print(assets!.length);
          final timelineService = ref.watch(timelineFactoryProvider).fromAssets(assets!);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(appBar: SliverToBoxAdapter(child: AppBar())),
    );
  }
}
