import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  CreateFamilyMemberDto,
  FamilyMemberResponseDto,
  UpdateFamilyMemberDto,
} from 'src/dtos/family-member.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { FamilyMemberService } from 'src/services/family-member.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.FamilyMembers)
@Controller('family-members')
export class FamilyMemberController {
  constructor(private service: FamilyMemberService) {}

  @Post()
  @Authenticated({ permission: Permission.All })
  @ApiOperation({ summary: 'Create a family member (admin only)' })
  create(@Auth() auth: AuthDto, @Body() dto: CreateFamilyMemberDto): Promise<FamilyMemberResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated()
  @ApiOperation({ summary: 'Get all family members' })
  getAll(@Auth() auth: AuthDto): Promise<FamilyMemberResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get('compare')
  @Authenticated()
  @ApiOperation({ summary: 'Compare all family members at the same age' })
  @ApiQuery({ name: 'ageMonths', required: true, type: Number, description: 'Age in months to compare' })
  @ApiQuery({ name: 'toleranceMonths', required: false, type: Number, description: 'Tolerance in months (default: 1)' })
  getAgeComparison(
    @Auth() auth: AuthDto,
    @Query('ageMonths') ageMonths: number,
    @Query('toleranceMonths') toleranceMonths?: number,
  ): Promise<{ age: string; comparisons: { member: FamilyMemberResponseDto; photos: any[]; exactAge: string }[] }> {
    return this.service.getAgeComparison(auth, Number(ageMonths), toleranceMonths ? Number(toleranceMonths) : 1);
  }

  @Get(':id')
  @Authenticated()
  @ApiOperation({ summary: 'Get a family member by ID' })
  get(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<FamilyMemberResponseDto> {
    return this.service.get(auth, id);
  }

  @Get(':id/photos')
  @Authenticated()
  @ApiOperation({ summary: 'Get photos of a family member at a specific age' })
  @ApiQuery({ name: 'ageMonths', required: true, type: Number, description: 'Age in months' })
  @ApiQuery({ name: 'toleranceMonths', required: false, type: Number, description: 'Tolerance in months (default: 1)' })
  getPhotosAtAge(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Query('ageMonths') ageMonths: number,
    @Query('toleranceMonths') toleranceMonths?: number,
  ): Promise<{ photos: any[]; exactAge: string }> {
    return this.service.getPhotosAtAge(auth, id, Number(ageMonths), toleranceMonths ? Number(toleranceMonths) : 1);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.All })
  @ApiOperation({ summary: 'Update a family member (admin only)' })
  update(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: UpdateFamilyMemberDto,
  ): Promise<FamilyMemberResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.All })
  @ApiOperation({ summary: 'Delete a family member (admin only)' })
  delete(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }
}
