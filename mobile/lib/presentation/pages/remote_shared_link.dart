import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:immich_mobile/domain/models/album/shared_album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/remote_shared_album.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/shared_link/shared_link.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/services/shared_link.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/common/shared_link_password_dialog.dart';
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
  SharedRemoteAlbum? sharedAlbum;

  late final RemoteSharedAlbumService sharedAlbumService;

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

    final assetApiRepository = AssetApiRepository(
      _apiService.assetsApi,
      _apiService.searchApi,
      _apiService.stacksApi,
      _apiService.trashApi,
    );
    final driftApiRepository = DriftAlbumApiRepository(_apiService.albumsApi);
    sharedAlbumService = RemoteSharedAlbumService(driftApiRepository, assetApiRepository);

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
      if (error.code == 401 && error.message != null && error.message!.contains("Invalid password")) {
        final password = await showDialog<String>(
          context: context,
          builder: (context) => const SharedLinkPasswordDialog(),
        );

        if (password == null) {
          context.pop();
        }

        try {
          sharedLink = await SharedLinkService(_apiService).getMySharedLink(password: password);
        } catch (e) {
          ImmichToast.show(
            context: context,
            msg: "errors.shared_link_invalid_password".t(context: context),
            toastType: ToastType.error,
          );

          context.pop();
          return;
        }
      }
    }

    if (sharedLink == null) {
      ImmichToast.show(
        context: context,
        msg: "errors.unable_to_get_shared_link".t(context: context),
        toastType: ToastType.error,
      );
      context.pop();
      return;
    }

    _refreshAssets();
    setState(() {});
  }

  Future<List<RemoteAsset>> retrieveSharedAlbumAssets() async {
    try {
      sharedAlbum = await sharedAlbumService.getSharedAlbum(sharedLink!.albumId!);

      return sharedAlbum?.assets ?? [];
    } catch (e) {
      ImmichToast.show(
        context: context,
        msg: "errors.failed_to_load_assets".t(context: context),
        toastType: ToastType.error,
      );
      return [];
    }
  }

  Future<void> _refreshAssets() async {
    // Retrieve assets from the shared link
    switch (sharedLink!.type) {
      case SharedLinkSource.album:
        assets = await retrieveSharedAlbumAssets();
        break;
      case SharedLinkSource.individual:
        assets = sharedLink!.assets;

        if (!(sharedLink!.allowUpload)) {
          context.replaceRoute(
            AssetViewerRoute(
              initialIndex: 0,
              timelineService: ref.read(timelineFactoryProvider).fromAssets(sharedLink!.assets),
            ),
          );
        }
        break;
    }

    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    Future<void> addAssets() async {
      final List<XFile> uploadAssets = await ImagePicker().pickMultipleMedia();

      if (uploadAssets.isEmpty) {
        return;
      }

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text("uploading".t(context: context)),
          content: const SizedBox(height: 48, child: Center(child: CircularProgressIndicator())),
        ),
      );

      await sharedAlbumService.uploadAssets(sharedAlbum!.id, uploadAssets);
      sharedAlbum = await sharedAlbumService.getSharedAlbum(sharedAlbum!.id);

      _refreshAssets();

      // close the dialog
      context.pop();
    }

    if (assets == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return ProviderScope(
      key: ValueKey(assets?.length),
      overrides: [
        apiServiceProvider.overrideWith((ref) => _apiService),
        timelineServiceProvider.overrideWith((ref) {
          final timelineService = ref.watch(timelineFactoryProvider).fromAssets(assets!);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(
        topSliverWidgetHeight: 0,
        topSliverWidget: const SliverToBoxAdapter(child: SizedBox.shrink()),
        groupBy: GroupAssetsBy.none,
        bottomSheet: null,
        appBar: SliverToBoxAdapter(
          child: AppBar(
            title: Text(sharedAlbum?.name ?? "shared_link".t(context: context)),
            actions: [
              if (sharedLink!.allowUpload)
                IconButton(
                  icon: const Icon(Icons.cloud_upload),
                  onPressed: () => addAssets(),
                  tooltip: "shared_link_upload".t(context: context),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
