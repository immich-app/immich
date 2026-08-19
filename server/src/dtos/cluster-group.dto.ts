import { Selectable } from 'kysely';
import { createZodDto } from 'nestjs-zod';
import { ClusterGroupRequestTable } from 'src/schema/tables/cluster-group-request.table';
import { isoDatetimeToDate } from 'src/validation';
import z from 'zod';

const ClusterGroupRequestCreateSchema = z
  .object({
    userId: z.uuidv4().describe('User to invite into the cluster group'),
  })
  .meta({ id: 'ClusterGroupRequestCreateDto' });

const ClusterGroupRequestResponseSchema = z
  .object({
    id: z.uuidv4().describe('Request ID'),
    clusterGroupId: z.uuidv4().describe('Cluster group the user is invited to join'),
    userId: z.uuidv4().describe('User the request was created for'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
  })
  .meta({ id: 'ClusterGroupRequestResponseDto' });

export class ClusterGroupRequestCreateDto extends createZodDto(ClusterGroupRequestCreateSchema) {}
export class ClusterGroupRequestResponseDto extends createZodDto(ClusterGroupRequestResponseSchema) {}

export function mapClusterGroupRequest(request: Selectable<ClusterGroupRequestTable>): ClusterGroupRequestResponseDto {
  return {
    id: request.id,
    clusterGroupId: request.clusterGroupId,
    userId: request.userId,
    createdAt: request.createdAt,
  };
}
