import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

class HDRImageView extends StatefulWidget {
  final String? localAssetId;
  final String? remoteUrl;
  final Map<String, String>? headers;
  final VoidCallback? onImageLoaded;

  const HDRImageView({
    super.key,
    this.localAssetId,
    this.remoteUrl,
    this.headers,
    this.onImageLoaded,
  });

  @override
  State<HDRImageView> createState() => _HDRImageViewState();
}

class _HDRImageViewState extends State<HDRImageView> {
  late final int _viewId;
  MethodChannel? _channel;

  Map<String, dynamic> get _creationParams {
    if (widget.localAssetId != null) {
      return {
        'source': 'local',
        'localAssetId': widget.localAssetId,
      };
    }
    return {
      'source': 'remote',
      'url': widget.remoteUrl,
      'headers': widget.headers ?? {},
    };
  }

  void _onPlatformViewCreated(int viewId) {
    _viewId = viewId;
    _channel = MethodChannel('immich/hdr_image_view/$_viewId');
    _channel!.setMethodCallHandler(_handleMethodCall);
  }

  Future<dynamic> _handleMethodCall(MethodCall call) async {
    if (call.method == 'onImageLoaded') {
      widget.onImageLoaded?.call();
    }
  }

  @override
  void dispose() {
    _channel?.setMethodCallHandler(null);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return UiKitView(
      viewType: 'immich/hdr_image_view',
      creationParams: _creationParams,
      creationParamsCodec: const StandardMessageCodec(),
      onPlatformViewCreated: _onPlatformViewCreated,
    );
  }
}
