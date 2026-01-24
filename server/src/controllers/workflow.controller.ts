import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { WorkflowCreateDto, WorkflowResponseDto, WorkflowUpdateDto } from 'src/dtos/workflow.dto';
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
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  createWorkflow(@Auth() auth: AuthDto, @Body() dto: WorkflowCreateDto): Promise<WorkflowResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.WorkflowRead })
  @Endpoint({
    summary: 'List all workflows',
    description: 'Retrieve a list of workflows available to the authenticated user.',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  getWorkflows(@Auth() auth: AuthDto): Promise<WorkflowResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.WorkflowRead })
  @Endpoint({
    summary: 'Retrieve a workflow',
    description: 'Retrieve information about a specific workflow by its ID.',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  getWorkflow(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<WorkflowResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.WorkflowUpdate })
  @Endpoint({
    summary: 'Update a workflow',
    description:
      'Update the information of a specific workflow by its ID. This endpoint can be used to update the workflow name, description, trigger type, filters and actions order, etc.',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
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
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  deleteWorkflow(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
