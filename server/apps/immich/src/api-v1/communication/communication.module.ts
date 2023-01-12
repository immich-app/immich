import { Module } from '@nestjs/common';
import { CommunicationGateway } from './communication.gateway';
import { ImmichJwtModule } from '../../modules/immich-jwt/immich-jwt.module';

@Module({
  imports: [ImmichJwtModule],
  providers: [CommunicationGateway],
  exports: [CommunicationGateway],
})
export class CommunicationModule {}
