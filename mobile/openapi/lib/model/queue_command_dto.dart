// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class QueueCommandDto {
  const QueueCommandDto({required this.command, this.force = const Optional.absent()});

  final QueueCommand command;

  /// Force the command execution (if applicable)
  final Optional<bool> force;

  static QueueCommandDto? fromJson(dynamic value) {
    ApiCompat.upgrade<QueueCommandDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      command: (QueueCommand.fromJson(json[r'command']))!,
      force: json.containsKey(r'force') ? Optional.present(json[r'force'] as bool) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'command'] = command.toJson();
    if (force case Present(:final value)) {
      json[r'force'] = value;
    }
    return json;
  }

  QueueCommandDto copyWith({QueueCommand? command, Optional<bool>? force}) {
    return .new(command: command ?? this.command, force: force ?? this.force);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is QueueCommandDto && command == other.command && force == other.force);
  }

  @override
  int get hashCode {
    return Object.hashAll([command, force]);
  }

  @override
  String toString() => 'QueueCommandDto(command=$command, force=$force)';
}
