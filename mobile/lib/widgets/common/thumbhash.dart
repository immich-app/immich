import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:thumbhash/thumbhash.dart' as thumbhash;

class ThumbhashImage extends RenderBox {
  Color _placeholderColor;
  ui.Image? _image;
  BoxFit _fit;

  ThumbhashImage({
    required ui.Image? image,
    required BoxFit fit,
    required Color placeholderColor,
  })  : _image = image,
        _fit = fit,
        _placeholderColor = placeholderColor;

  @override
  void paint(PaintingContext context, Offset offset) {
    final image = _image;
    final rect = offset & size;
    if (image == null) {
      final paint = Paint();
      paint.color = _placeholderColor;
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

  set placeholderColor(Color value) {
    if (_placeholderColor != value) {
      _placeholderColor = value;
      markNeedsPaint();
    }
  }
}

class ThumbhashLeaf extends LeafRenderObjectWidget {
  final ui.Image? image;
  final BoxFit fit;
  final Color placeholderColor;

  const ThumbhashLeaf({
    super.key,
    required this.image,
    required this.fit,
    required this.placeholderColor,
  });

  @override
  RenderObject createRenderObject(BuildContext context) {
    return ThumbhashImage(
      image: image,
      fit: fit,
      placeholderColor: placeholderColor,
    );
  }

  @override
  void updateRenderObject(BuildContext context, ThumbhashImage renderObject) {
    renderObject.fit = fit;
    renderObject.image = image;
    renderObject.placeholderColor = placeholderColor;
  }
}

class Thumbhash extends StatefulWidget {
  final String? blurhash;
  final BoxFit fit;
  final Color placeholderColor;

  const Thumbhash({
    required this.blurhash,
    this.fit = BoxFit.cover,
    this.placeholderColor = const Color.fromRGBO(0, 0, 0, 0.2),
    super.key,
  });

  @override
  State<Thumbhash> createState() => _ThumbhashState();
}

class _ThumbhashState extends State<Thumbhash> {
  String? blurhash;
  BoxFit? fit;
  ui.Image? _image;
  Color? placeholderColor;

  @override
  void initState() {
    super.initState();
    final blurhash_ = blurhash = widget.blurhash;
    fit = widget.fit;
    placeholderColor = widget.placeholderColor;
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
    return ThumbhashLeaf(
      image: _image,
      fit: fit!,
      placeholderColor: placeholderColor!,
    );
  }

  @override
  void dispose() {
    _image?.dispose();
    super.dispose();
  }
}
