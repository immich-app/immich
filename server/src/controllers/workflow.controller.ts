import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiBody({ description: 'Workflow creation data', type: WorkflowCreateDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Workflow created successfully', type: WorkflowResponseDto })
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
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved workflows', type: [WorkflowResponseDto] })
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
  @ApiParam({ name: 'id', description: 'Workflow ID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved workflow', type: WorkflowResponseDto })
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
  @ApiParam({ name: 'id', description: 'Workflow ID', type: String, format: 'uuid' })
  @ApiBody({ description: 'Workflow update data', type: WorkflowUpdateDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Workflow updated successfully', type: WorkflowResponseDto })
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
  @ApiParam({ name: 'id', description: 'Workflow ID', type: String, format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Workflow deleted successfully' })
  @Endpoint({
    summary: 'Delete a workflow',
    description: 'Delete a workflow by its ID.',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  deleteWorkflow(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
