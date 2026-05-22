/// An exception for the [ImageLoader] and the Immich image providers
class ImageLoadingException implements Exception {
  final String message;
  const ImageLoadingException(this.message);
}
