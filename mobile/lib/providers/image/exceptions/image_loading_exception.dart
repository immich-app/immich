/// An exception for the [ImageLoader] and the Immich image providers
class ImageLoadingException implements Exception {
  final String message;
  ImageLoadingException(this.message);
}
