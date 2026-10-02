import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

/// An [Image] that incrementally follows the content of an [ImageProvider]
///
/// This is required for quality upgrades on Android when "Remove animations" is enabled. As of Flutter 3.44, using the normal [ImageProvider] would not progress past the initial image
class ProgressiveImage extends StatefulWidget {
  const ProgressiveImage({required this.provider, required this.builder, super.key});

  final ImageProvider provider;

  /// Builds the image widget with the [provider] to display. This is invoked incrementally to produce new widget trees as the image loads
  final Widget Function(BuildContext context, ImageProvider provider) builder;

  @override
  State<ProgressiveImage> createState() => _ProgressiveImageState();
}

class _ProgressiveImageState extends State<ProgressiveImage> {
  ImageInfo? _info;

  ImageStream? _activeStream;
  ImageStreamListener? _listener;

  _SingleFrameImageProvider? _frame;

  bool _isFirstFrame = true;

  @override
  void initState() {
    super.initState();
    _resolve();
  }

  @override
  void didUpdateWidget(ProgressiveImage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.provider != oldWidget.provider) {
      _resolve();
    }
  }

  @override
  void dispose() {
    _removeListener();
    _setImageInfo(null);

    super.dispose();
  }

  void _resolve() {
    final stream = widget.provider.resolve(ImageConfiguration.empty);
    if (_activeStream?.key == stream.key) {
      return;
    }

    _removeListener();
    _isFirstFrame = true;
    _frame = null;

    // The upstream image resolver handles the errors
    _listener = ImageStreamListener(_onFrame, onError: (error, stackTrace) => {});
    _activeStream = stream;

    _activeStream?.addListener(_listener!);
  }

  void _removeListener() {
    if (_listener == null) {
      return;
    }

    _activeStream?.removeListener(_listener!);
    _listener = null;
  }

  void _onFrame(ImageInfo info, bool synchronousCall) {
    if (_isFirstFrame) {
      // [Image] has already resolved the very first frame, so we don't have to do anything special
      _isFirstFrame = false;
      info.dispose();

      return;
    }

    // A multi frame stream is a real animation, which [Image] is right to pause.
    if (_activeStream?.completer is MultiFrameImageStreamCompleter) {
      // A multi-frame stream (like an animated gif) should be paused. Do nothing
      info.dispose();

      return;
    }

    void setFrame() {
      _setImageInfo(info);

      _frame = _SingleFrameImageProvider(info);
    }

    if (synchronousCall) {
      setFrame();
    } else {
      setState(setFrame);
    }
  }

  void _setImageInfo(ImageInfo? info) {
    final oldInfo = _info;
    _info = info;

    if (oldInfo != null) {
      // An old image may still be rendered, so wait to dispose it
      WidgetsBinding.instance.addPostFrameCallback((_) => oldInfo.dispose());
    }
  }

  @override
  Widget build(BuildContext context) => widget.builder(context, _frame ?? widget.provider);
}

/// Directly displays a single image
class _SingleFrameImageProvider extends ImageProvider<_SingleFrameImageProvider> {
  const _SingleFrameImageProvider(this.info);

  final ImageInfo info;

  @override
  Future<_SingleFrameImageProvider> obtainKey(ImageConfiguration configuration) => SynchronousFuture(this);

  @override
  ImageStreamCompleter loadImage(_SingleFrameImageProvider key, ImageDecoderCallback decode) =>
      OneFrameImageStreamCompleter(SynchronousFuture(info.clone()));

  @override
  void resolveStreamForKey(
    ImageConfiguration configuration,
    ImageStream stream,
    _SingleFrameImageProvider key,
    ImageErrorListener handleError,
  ) {
    // We explicitly do not want to cache anything, as our parent [ProgressiveImage] already retains it
    stream.setCompleter(loadImage(key, PaintingBinding.instance.instantiateImageCodecWithSize));
  }
}
