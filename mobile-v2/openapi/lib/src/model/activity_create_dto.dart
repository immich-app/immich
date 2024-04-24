//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:openapi/src/model/reaction_type.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'activity_create_dto.g.dart';

/// ActivityCreateDto
///
/// Properties:
/// * [albumId] 
/// * [assetId] 
/// * [comment] 
/// * [type] 
@BuiltValue()
abstract class ActivityCreateDto implements Built<ActivityCreateDto, ActivityCreateDtoBuilder> {
  @BuiltValueField(wireName: r'albumId')
  String get albumId;

  @BuiltValueField(wireName: r'assetId')
  String? get assetId;

  @BuiltValueField(wireName: r'comment')
  String? get comment;

  @BuiltValueField(wireName: r'type')
  ReactionType get type;
  // enum typeEnum {  comment,  like,  };

  ActivityCreateDto._();

  factory ActivityCreateDto([void updates(ActivityCreateDtoBuilder b)]) = _$ActivityCreateDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ActivityCreateDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ActivityCreateDto> get serializer => _$ActivityCreateDtoSerializer();
}

class _$ActivityCreateDtoSerializer implements PrimitiveSerializer<ActivityCreateDto> {
  @override
  final Iterable<Type> types = const [ActivityCreateDto, _$ActivityCreateDto];

  @override
  final String wireName = r'ActivityCreateDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ActivityCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'albumId';
    yield serializers.serialize(
      object.albumId,
      specifiedType: const FullType(String),
    );
    if (object.assetId != null) {
      yield r'assetId';
      yield serializers.serialize(
        object.assetId,
        specifiedType: const FullType(String),
      );
    }
    if (object.comment != null) {
      yield r'comment';
      yield serializers.serialize(
        object.comment,
        specifiedType: const FullType(String),
      );
    }
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(ReactionType),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ActivityCreateDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ActivityCreateDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'albumId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.albumId = valueDes;
          break;
        case r'assetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.assetId = valueDes;
          break;
        case r'comment':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.comment = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ReactionType),
          ) as ReactionType;
          result.type = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ActivityCreateDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ActivityCreateDtoBuilder();
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

