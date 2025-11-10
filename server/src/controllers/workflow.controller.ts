import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  createWorkflow(@Auth() auth: AuthDto, @Body() dto: WorkflowCreateDto): Promise<WorkflowResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.WorkflowRead })
  getWorkflows(@Auth() auth: AuthDto): Promise<WorkflowResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.WorkflowRead })
  getWorkflow(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<WorkflowResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.WorkflowUpdate })
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
  deleteWorkflow(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
