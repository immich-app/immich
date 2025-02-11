import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { UserAvatarColor } from 'src/enum';

registerEnumType(UserAvatarColor, {
  name: 'UserAvatarColor',
});

@ObjectType()
export class User {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field(() => UserAvatarColor)
  avatarColor!: UserAvatarColor;

  @Field()
  profileImagePath!: string;

  @Field({ nullable: true })
  profileChangedAt!: Date;
}
