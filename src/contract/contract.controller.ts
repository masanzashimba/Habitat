import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('contracts')
@UseGuards(JwtAccessGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  create(
    @Body() createContractDto: CreateContractDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.contractService.create(createContractDto, userId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadContract(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /\.(pdf|doc|docx)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('leaseId') leaseId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.uploadFile(leaseId, file, userId, userRole);
  }

  @Get()
  findAll(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.findAll(userId, userRole);
  }

  @Get('signed')
  findSigned(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.findSigned(userId, userRole);
  }

  @Get('unsigned')
  findUnsigned(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.findUnsigned(userId, userRole);
  }

  @Get('status/summary')
  getContractsSummary(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.getContractsSummary(userId, userRole);
  }

  @Get('lease/:leaseId')
  findByLease(
    @Param('leaseId') leaseId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.findByLease(leaseId, userId, userRole);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.findOne(id, userId, userRole);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.update(id, updateContractDto, userId, userRole);
  }

  @Put(':id/sign')
  sign(
    @Param('id') id: string,
    @Body() signContractDto: SignContractDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.sign(
      id,
      userId,
      userRole,
      signContractDto.userId,
    );
  }

  @Put(':id/unsign')
  unsign(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.unsign(id, userId, userRole);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.remove(id, userId, userRole);
  }

  // =============================
  // AUTOMATIC CONTRACT GENERATION
  // =============================

  @Post('generate/:leaseId')
  async generateContract(
    @Param('leaseId') leaseId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.contractService.generateAndUploadContract(
      leaseId,
      userId,
      userRole,
    );
  }

  @Get('preview/:leaseId/html')
  async previewContractHTML(
    @Param('leaseId') leaseId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const html = await this.contractService.getContractHTML(
      leaseId,
      userId,
      userRole,
    );
    return { html };
  }

  @Get('download/:leaseId/pdf')
  async downloadContractPDF(
    @Param('leaseId') leaseId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    const pdfBuffer = await this.contractService.downloadContractPDF(
      leaseId,
      userId,
      userRole,
    );

    return {
      buffer: pdfBuffer.toString('base64'),
      filename: `contrat-bail-${leaseId}.pdf`,
      contentType: 'application/pdf',
    };
  }

  // =============================
  // DEBUG ROUTE
  // =============================
  @Get('debug/user-info')
  async debugUserInfo(@CurrentUser('userId') userId: string) {
    // Trouver le tenant associé à cet utilisateur
    const tenant = await this.contractService.findTenantByUserId(userId);

    // Trouver tous les contrats
    const allContracts = await this.contractService.findAllContractsDebug();

    return {
      userId,
      tenant,
      totalContracts: allContracts.length,
      contracts: allContracts.map((c) => ({
        id: c.id,
        leaseId: c.leaseId,
        tenantId: c.lease.tenantId,
        tenantUserId: c.lease.tenant.userId,
      })),
    };
  }
}
