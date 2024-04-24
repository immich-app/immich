//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'queue_status_dto.g.dart';

/// QueueStatusDto
///
/// Properties:
/// * [isActive] 
/// * [isPaused] 
@BuiltValue()
abstract class QueueStatusDto implements Built<QueueStatusDto, QueueStatusDtoBuilder> {
  @BuiltValueField(wireName: r'isActive')
  bool get isActive;

  @BuiltValueField(wireName: r'isPaused')
  bool get isPaused;

  QueueStatusDto._();

  factory QueueStatusDto([void updates(QueueStatusDtoBuilder b)]) = _$QueueStatusDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(QueueStatusDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<QueueStatusDto> get serializer => _$QueueStatusDtoSerializer();
}

class _$QueueStatusDtoSerializer implements PrimitiveSerializer<QueueStatusDto> {
  @override
  final Iterable<Type> types = const [QueueStatusDto, _$QueueStatusDto];

  @override
  final String wireName = r'QueueStatusDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    QueueStatusDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'isActive';
    yield serializers.serialize(
      object.isActive,
      specifiedType: const FullType(bool),
    );
    yield r'isPaused';
    yield serializers.serialize(
      object.isPaused,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    QueueStatusDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required QueueStatusDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'isActive':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isActive = valueDes;
          break;
        case r'isPaused':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isPaused = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  QueueStatusDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = QueueStatusDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

