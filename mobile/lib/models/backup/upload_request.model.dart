class UploadRequest {
  final String method;
  final String url;
  int priority = 0;
  final Map<String, String> headers;
  final Map<String, String> fields;
  final bool isBackground;
  void Function(int, int) onProgress;

  UploadRequest(
      {required this.method,
      required this.url,
      required this.fields,
      required this.headers,
      required this.isBackground,
      required this.onProgress});

  @override
  bool operator ==(covariant UploadRequest other) {
    if (identical(this, other)) return true;

    return other.method == method &&
        other.url == url &&
        other.fields == fields &&
        other.headers == headers &&
        other.onProgress == onProgress;
  }

  @override
  int get hashCode =>
      method.hashCode ^
      url.hashCode ^
      priority.hashCode ^
      headers.hashCode ^
      fields.hashCode;
}
