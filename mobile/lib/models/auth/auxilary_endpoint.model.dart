// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

class AuxilaryEndpoint {
  final String url;
  final AuxCheckStatus status;

  AuxilaryEndpoint({
    required this.url,
    required this.status,
  });

  AuxilaryEndpoint copyWith({
    String? url,
    AuxCheckStatus? status,
  }) {
    return AuxilaryEndpoint(
      url: url ?? this.url,
      status: status ?? this.status,
    );
  }

  @override
  String toString() => 'AuxilaryEndpoint(url: $url, status: $status)';

  @override
  bool operator ==(covariant AuxilaryEndpoint other) {
    if (identical(this, other)) return true;

    return other.url == url && other.status == status;
  }

  @override
  int get hashCode => url.hashCode ^ status.hashCode;

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'url': url,
      'status': status.toMap(),
    };
  }

  factory AuxilaryEndpoint.fromMap(Map<String, dynamic> map) {
    return AuxilaryEndpoint(
      url: map['url'] as String,
      status: AuxCheckStatus.fromMap(map['status'] as Map<String, dynamic>),
    );
  }

  String toJson() => json.encode(toMap());

  factory AuxilaryEndpoint.fromJson(String source) =>
      AuxilaryEndpoint.fromMap(json.decode(source) as Map<String, dynamic>);
}

class AuxCheckStatus {
  final String name;
  AuxCheckStatus({
    required this.name,
  });
  const AuxCheckStatus._(this.name);

  static const loading = AuxCheckStatus._('loading');
  static const valid = AuxCheckStatus._('valid');
  static const error = AuxCheckStatus._('error');
  static const unknown = AuxCheckStatus._('unknown');

  @override
  bool operator ==(covariant AuxCheckStatus other) {
    if (identical(this, other)) return true;

    return other.name == name;
  }

  @override
  int get hashCode => name.hashCode;

  AuxCheckStatus copyWith({
    String? name,
  }) {
    return AuxCheckStatus(
      name: name ?? this.name,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'name': name,
    };
  }

  factory AuxCheckStatus.fromMap(Map<String, dynamic> map) {
    return AuxCheckStatus(
      name: map['name'] as String,
    );
  }

  String toJson() => json.encode(toMap());

  factory AuxCheckStatus.fromJson(String source) =>
      AuxCheckStatus.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'AuxCheckStatus(name: $name)';
}
