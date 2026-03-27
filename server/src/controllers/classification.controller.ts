import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  ClassificationCategoryCreateDto,
  ClassificationCategoryResponseDto,
  ClassificationCategoryUpdateDto,
} from 'src/dtos/classification.dto';
import { ApiTag } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { ClassificationService } from 'src/services/classification.service';
import { UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Classification)
@Controller('classification/categories')
export class ClassificationController {
  constructor(private service: ClassificationService) {}

  @Get()
  @Authenticated()
  @Endpoint({
    summary: 'Get classification categories',
    history: new HistoryBuilder().added('v1'),
  })
  getCategories(@Auth() auth: AuthDto): Promise<ClassificationCategoryResponseDto[]> {
    return this.service.getCategories(auth);
  }

  @Post()
  @Authenticated()
  @Endpoint({
    summary: 'Create a classification category',
    history: new HistoryBuilder().added('v1'),
  })
  createCategory(
    @Auth() auth: AuthDto,
    @Body() dto: ClassificationCategoryCreateDto,
  ): Promise<ClassificationCategoryResponseDto> {
    return this.service.createCategory(auth, dto);
  }

  @Put(':id')
  @Authenticated()
  @Endpoint({
    summary: 'Update a classification category',
    history: new HistoryBuilder().added('v1'),
  })
  updateCategory(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: ClassificationCategoryUpdateDto,
  ): Promise<ClassificationCategoryResponseDto> {
    return this.service.updateCategory(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a classification category',
    history: new HistoryBuilder().added('v1'),
  })
  deleteCategory(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.deleteCategory(auth, id);
  }

  @Post('scan')
  @Authenticated()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Scan library for classification',
    history: new HistoryBuilder().added('v1'),
  })
  scanClassification(@Auth() auth: AuthDto): Promise<void> {
    return this.service.scanLibrary(auth);
  }
}
