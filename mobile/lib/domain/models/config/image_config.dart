class ImageConfig {
  final bool preferRemote;
  final bool loadPreview;
  final bool loadOriginal;

  const ImageConfig({this.preferRemote = false, this.loadPreview = true, this.loadOriginal = false});

  ImageConfig copyWith({bool? preferRemote, bool? loadPreview, bool? loadOriginal}) => ImageConfig(
    preferRemote: preferRemote ?? this.preferRemote,
    loadPreview: loadPreview ?? this.loadPreview,
    loadOriginal: loadOriginal ?? this.loadOriginal,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ImageConfig &&
          other.preferRemote == preferRemote &&
          other.loadPreview == loadPreview &&
          other.loadOriginal == loadOriginal);

  @override
  int get hashCode => Object.hash(preferRemote, loadPreview, loadOriginal);

  @override
  String toString() =>
      'ImageConfig(preferRemoteImage: $preferRemote, loadPreview: $loadPreview, loadOriginal: $loadOriginal)';
}
