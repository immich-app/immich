//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:openapi/src/model/user_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'activity_response_dto.g.dart';

/// ActivityResponseDto
///
/// Properties:
/// * [assetId] 
/// * [comment] 
/// * [createdAt] 
/// * [id] 
/// * [type] 
/// * [user] 
@BuiltValue()
abstract class ActivityResponseDto implements Built<ActivityResponseDto, ActivityResponseDtoBuilder> {
  @BuiltValueField(wireName: r'assetId')
  String? get assetId;

  @BuiltValueField(wireName: r'comment')
  String? get comment;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'type')
  ActivityResponseDtoTypeEnum get type;
  // enum typeEnum {  comment,  like,  };

  @BuiltValueField(wireName: r'user')
  UserDto get user;

  ActivityResponseDto._();

  factory ActivityResponseDto([void updates(ActivityResponseDtoBuilder b)]) = _$ActivityResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ActivityResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ActivityResponseDto> get serializer => _$ActivityResponseDtoSerializer();
}

class _$ActivityResponseDtoSerializer implements PrimitiveSerializer<ActivityResponseDto> {
  @override
  final Iterable<Type> types = const [ActivityResponseDto, _$ActivityResponseDto];

  @override
  final String wireName = r'ActivityResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ActivityResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'assetId';
    yield object.assetId == null ? null : serializers.serialize(
      object.assetId,
      specifiedType: const FullType.nullable(String),
    );
    if (object.comment != null) {
      yield r'comment';
      yield serializers.serialize(
        object.comment,
        specifiedType: const FullType.nullable(String),
      );
    }
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'type';
    yield serializers.serialize(
      object.type,
      specifiedType: const FullType(ActivityResponseDtoTypeEnum),
    );
    yield r'user';
    yield serializers.serialize(
      object.user,
      specifiedType: const FullType(UserDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ActivityResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ActivityResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'assetId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.assetId = valueDes;
          break;
        case r'comment':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.comment = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'type':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ActivityResponseDtoTypeEnum),
          ) as ActivityResponseDtoTypeEnum;
          result.type = valueDes;
          break;
        case r'user':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UserDto),
          ) as UserDto;
          result.user.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ActivityResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ActivityResponseDtoBuilder();
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

class ActivityResponseDtoTypeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'comment')
  static const ActivityResponseDtoTypeEnum comment = _$activityResponseDtoTypeEnum_comment;
  @BuiltValueEnumConst(wireName: r'like')
  static const ActivityResponseDtoTypeEnum like = _$activityResponseDtoTypeEnum_like;

  static Serializer<ActivityResponseDtoTypeEnum> get serializer => _$activityResponseDtoTypeEnumSerializer;

  const ActivityResponseDtoTypeEnum._(String name): super(name);

  static BuiltSet<ActivityResponseDtoTypeEnum> get values => _$activityResponseDtoTypeEnumValues;
  static ActivityResponseDtoTypeEnum valueOf(String name) => _$activityResponseDtoTypeEnumValueOf(name);
}

