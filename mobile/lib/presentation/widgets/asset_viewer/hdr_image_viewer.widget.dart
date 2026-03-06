import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/presentation/widgets/images/hdr_image_view.dart';
import 'package:immich_mobile/services/api.service.dart';

class HDRImageViewer extends StatefulWidget {
  final BaseAsset asset;
  final Widget image;

  const HDRImageViewer({
    super.key,
    required this.asset,
    required this.image,
  });

  @override
  State<HDRImageViewer> createState() => _HDRImageViewerState();
}

class _HDRImageViewerState extends State<HDRImageViewer> {
  bool _showNativeView = false;
  bool _pendingShow = false;
  ScrollPosition? _scrollPosition;
  VoidCallback? _scrollListener;

  bool get _shouldUseLocalAsset =>
      widget.asset.hasLocal &&
      (!widget.asset.hasRemote || !AppSetting.get(Setting.preferRemoteImage)) &&
      !widget.asset.isEdited;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startWatching();
    });
  }

  @override
  void dispose() {
    _removeScrollListener();
    super.dispose();
  }

  void _removeScrollListener() {
    if (_scrollListener != null && _scrollPosition != null) {
      _scrollPosition!.isScrollingNotifier.removeListener(_scrollListener!);
      _scrollListener = null;
      _scrollPosition = null;
    }
  }

  void _startWatching() {
    if (!mounted) return;
    final scrollable = Scrollable.maybeOf(context);
    if (scrollable == null) {
      _scheduleShow();
      return;
    }

    _scrollPosition = scrollable.position;

    if (!_scrollPosition!.isScrollingNotifier.value) {
      _scheduleShow();
    }

    _scrollListener = () {
      if (!mounted) return;
      if (_scrollPosition!.isScrollingNotifier.value) {
        _pendingShow = false;
      } else {
        _scheduleShow();
      }
    };
    _scrollPosition!.isScrollingNotifier.addListener(_scrollListener!);
  }

  void _scheduleShow() {
    _pendingShow = true;
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted && _pendingShow) {
        _removeScrollListener();
        setState(() => _showNativeView = true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_showNativeView) {
      return Center(key: ValueKey(widget.asset.heroTag), child: widget.image);
    }

    final String? localAssetId;
    final String? remoteUrl;
    final Map<String, String>? headers;

    if (_shouldUseLocalAsset) {
      localAssetId = widget.asset is LocalAsset
          ? (widget.asset as LocalAsset).id
          : (widget.asset as RemoteAsset).localId;
      remoteUrl = null;
      headers = null;
    } else {
      localAssetId = null;
      final String assetId;
      if (widget.asset is LocalAsset && widget.asset.hasRemote) {
        assetId = (widget.asset as LocalAsset).remoteId!;
      } else if (widget.asset is RemoteAsset) {
        assetId = (widget.asset as RemoteAsset).id;
      } else {
        return Center(key: ValueKey(widget.asset.heroTag), child: widget.image);
      }
      remoteUrl = '${Store.get(StoreKey.serverEndpoint)}/assets/$assetId/original';
      headers = ApiService.getRequestHeaders();
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        Center(key: ValueKey(widget.asset.heroTag), child: widget.image),
        IgnorePointer(
          child: HDRImageView(
            localAssetId: localAssetId,
            remoteUrl: remoteUrl,
            headers: headers,
          ),
        ),
      ],
    );
  }
}
