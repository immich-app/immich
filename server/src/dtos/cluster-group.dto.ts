import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import { Selectable } from 'kysely';
import z from 'zod';
import { ClusterGroupRequestTable } from 'src/schema/tables/cluster-group-request.table.js';
import { isoDatetimeToDate } from 'src/validation.js';

export class ClusterGroupRequestCreateDto extends createZodDto({
  userId: z.uuidv4().describe('User to invite into the cluster group'),
}) {}

export class ClusterGroupRequestResponseDto extends createZodDto({
  id: z.uuidv4().describe('Request ID'),
  clusterGroupId: z.uuidv4().describe('Cluster group the user is invited to join'),
  userId: z.uuidv4().describe('User the request was created for'),
  createdAt: isoDatetimeToDate.describe('Creation date'),
}) {}

export function mapClusterGroupRequest(request: Selectable<ClusterGroupRequestTable>): ClusterGroupRequestResponseDto {
  return {
    id: request.id,
    clusterGroupId: request.clusterGroupId,
    userId: request.userId,
    createdAt: request.createdAt,
  };
}
