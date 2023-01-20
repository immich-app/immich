String sanitizeUrl(String url) {
  // Add schema if none is set
  final urlWithSchema =
      url.startsWith(RegExp(r"https?://")) ? url : "https://$url";

  // Remove trailing slash(es)
  return urlWithSchema.replaceFirst(RegExp(r"/+$"), "");
}
