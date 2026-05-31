import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  WorkflowCreateDto,
  WorkflowResponseDto,
  WorkflowSearchDto,
  WorkflowShareResponseDto,
  WorkflowTriggerResponseDto,
  WorkflowUpdateDto,
} from 'src/dtos/workflow.dto';
import { Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { WorkflowService } from 'src/services/workflow.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags('Workflows')
@Controller('workflows')
export class WorkflowController {
  constructor(private service: WorkflowService) {}

  @Post()
  @Authenticated({ permission: Permission.WorkflowCreate })
  @Endpoint({
    summary: 'Create a workflow',
    description: 'Create a new workflow, the workflow can also be created with empty filters and actions.',
    history: HistoryBuilder.v3(),
  })
  createWorkflow(@Auth() auth: AuthDto, @Body() dto: WorkflowCreateDto): Promise<WorkflowResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.WorkflowRead })
  @Endpoint({
    summary: 'List all workflows',
    description: 'Retrieve a list of workflows available to the authenticated user.',
    history: HistoryBuilder.v3(),
  })
  searchWorkflows(@Auth() auth: AuthDto, @Query() dto: WorkflowSearchDto): Promise<WorkflowResponseDto[]> {
    return this.service.search(auth, dto);
  }

  @Get('triggers')
  @Authenticated({ permission: false })
  @Endpoint({
    summary: 'List all workflow triggers',
    description: 'Retrieve a list of all available workflow triggers.',
    history: HistoryBuilder.v3(),
  })
  getWorkflowTriggers(): WorkflowTriggerResponseDto[] {
    return this.service.getTriggers();
  }

  @Get(':id')
  @Authenticated({ permission: Permission.WorkflowRead })
  @Endpoint({
    summary: 'Retrieve a workflow',
    description: 'Retrieve information about a specific workflow by its ID.',
    history: HistoryBuilder.v3(),
  })
  getWorkflow(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<WorkflowResponseDto> {
    return this.service.get(auth, id);
  }

  @Get(':id/share')
  @Authenticated({ permission: Permission.WorkflowRead })
  @Endpoint({
    summary: 'Retrieve a workflow',
    description: 'Retrieve a workflow details without ids, default values, etc.',
    history: HistoryBuilder.v3(),
  })
  getWorkflowForShare(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<WorkflowShareResponseDto> {
    return this.service.share(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.WorkflowUpdate })
  @Endpoint({
    summary: 'Update a workflow',
    description:
      'Update the information of a specific workflow by its ID. This endpoint can be used to update the workflow name, description, trigger type, filters and actions order, etc.',
    history: HistoryBuilder.v3(),
  })
  updateWorkflow(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: WorkflowUpdateDto,
  ): Promise<WorkflowResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.WorkflowDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a workflow',
    description: 'Delete a workflow by its ID.',
    history: HistoryBuilder.v3(),
  })
  deleteWorkflow(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
