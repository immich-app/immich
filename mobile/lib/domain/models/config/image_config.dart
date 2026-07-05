class ImageConfig {
  final bool preferRemote;
  final bool loadOriginal;

  const ImageConfig({this.preferRemote = false, this.loadOriginal = false});

  ImageConfig copyWith({bool? preferRemote, bool? loadOriginal}) =>
      ImageConfig(preferRemote: preferRemote ?? this.preferRemote, loadOriginal: loadOriginal ?? this.loadOriginal);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ImageConfig && other.preferRemote == preferRemote && other.loadOriginal == loadOriginal);

  @override
  int get hashCode => Object.hash(preferRemote, loadOriginal);

  @override
  String toString() => 'ImageConfig(preferRemoteImage: $preferRemote, loadOriginal: $loadOriginal)';
}
