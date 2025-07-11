import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:thumbhash/thumbhash.dart' as thumbhash;


class Thumbhash extends StatefulWidget {
  final String? blurhash;
  final BoxFit fit;

  const Thumbhash({
    this.blurhash,
    this.fit = BoxFit.cover,
    super.key,
  });

  @override
  State<Thumbhash> createState() => _ThumbhashState();
}


class _ThumbhashState extends State<Thumbhash> {
  String? blurhash;
  BoxFit? fit;
  ui.Image? _image;

  static final _gradientCache = <ColorScheme, Gradient>{};

  @override
  void initState() {
    super.initState();
    final blurhash_ = blurhash = widget.blurhash;
    fit = widget.fit;
    if (blurhash_ == null) {
      return;
    }
    final image = thumbhash.thumbHashToRGBA(base64.decode(blurhash_));
    _decode(image);
  }

  Future<void> _decode(thumbhash.Image image) async {
    if (!mounted) {
      return;
    }
    final buffer = await ImmutableBuffer.fromUint8List(image.rgba);
    if (!mounted) {
      buffer.dispose();
      return;
    }

    final descriptor = ImageDescriptor.raw(
      buffer,
      width: image.width,
      height: image.height,
      pixelFormat: PixelFormat.rgba8888,
    );
    if (!mounted) {
      buffer.dispose();
      descriptor.dispose();
      return;
    }

    final codec = await descriptor.instantiateCodec(
      targetWidth: image.width,
      targetHeight: image.height,
    );
    if (!mounted) {
      buffer.dispose();
      descriptor.dispose();
      codec.dispose();
      return;
    }

    final frame = (await codec.getNextFrame()).image;
    buffer.dispose();
    descriptor.dispose();
    codec.dispose();
    if (!mounted) {
      frame.dispose();
      return;
    }
    setState(() {
      _image = frame;
    });
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = context.colorScheme;
    final gradient = _gradientCache[colorScheme] ??= LinearGradient(
      colors: [
        colorScheme.surfaceContainer,
        colorScheme.surfaceContainer.darken(amount: .1),
      ],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    );

    return _ThumbhashLeaf(
      image: _image,
      fit: fit!,
      placeholderGradient: gradient,
    );
  }

  @override
  void dispose() {
    _image?.dispose();
    super.dispose();
  }
}

class _ThumbhashLeaf extends LeafRenderObjectWidget {
  final ui.Image? image;
  final BoxFit fit;
  final Gradient placeholderGradient;

  const _ThumbhashLeaf({
    required this.image,
    required this.fit,
    required this.placeholderGradient,
  });

  @override
  RenderObject createRenderObject(BuildContext context) {
    return _ThumbhashRenderBox(
      image: image,
      fit: fit,
      placeholderGradient: placeholderGradient,
    );
  }

  @override
  void updateRenderObject(
    BuildContext context,
    _ThumbhashRenderBox renderObject,
  ) {
    renderObject.fit = fit;
    renderObject.image = image;
    renderObject.placeholderGradient = placeholderGradient;
  }
}

class _ThumbhashRenderBox extends RenderBox {
  ui.Image? _image;
  BoxFit _fit;
  Gradient _placeholderGradient;

  _ThumbhashRenderBox({
    required ui.Image? image,
    required BoxFit fit,
    required Gradient placeholderGradient,
  })  : _image = image,
        _fit = fit,
        _placeholderGradient = placeholderGradient;

  @override
  void paint(PaintingContext context, Offset offset) {
    final image = _image;
    final rect = offset & size;
    if (image == null) {
      final paint = Paint();
      paint.shader = _placeholderGradient.createShader(rect);
      context.canvas.drawRect(rect, paint);
      return;
    }

    paintImage(
      canvas: context.canvas,
      rect: rect,
      image: image,
      fit: _fit,
      filterQuality: FilterQuality.low,
    );
  }

  @override
  void performLayout() {
    size = constraints.biggest;
  }

  set image(ui.Image? value) {
    if (_image != value) {
      _image = value;
      markNeedsPaint();
    }
  }

  set fit(BoxFit value) {
    if (_fit != value) {
      _fit = value;
      markNeedsPaint();
    }
  }

  set placeholderGradient(Gradient value) {
    if (_placeholderGradient != value) {
      _placeholderGradient = value;
      markNeedsPaint();
    }
  }
}
