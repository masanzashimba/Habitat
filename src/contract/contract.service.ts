import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../cloudinary.service';
import { ContractGeneratorService } from './contract-generator.service';

@Injectable()
export class ContractService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly contractGenerator: ContractGeneratorService,
  ) {}

  async create(createContractDto: CreateContractDto, userId: string) {
    const {
      leaseId,
      fileUrl,
      createdBy,
      userId: contractUserId,
    } = createContractDto;

    // Verify lease exists
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: true,
        tenant: true,
        contract: true,
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    // Check if contract already exists for this lease
    if (lease.contract) {
      throw new BadRequestException('Contract already exists for this lease');
    }

    // Verify creator exists
    const creator = await this.prisma.user.findUnique({
      where: { id: createdBy },
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // If userId provided, verify user exists
    if (contractUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: contractUserId },
      });

      if (!user) {
        throw new NotFoundException('Contract user not found');
      }
    }

    // Create contract
    return this.prisma.contract.create({
      data: {
        leaseId,
        fileUrl,
        createdBy,
        userId: contractUserId,
      },
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
            owner: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(userId: string, userRole: string) {
    let where: any = {};

    // Filter based on role
    if (userRole === 'owner') {
      where.lease = {
        ownerId: userId,
      };
    } else if (userRole === 'tenant') {
      where.lease = {
        tenant: {
          userId,
        },
      };
    }
    // Admin sees all contracts (no filter)

    return this.prisma.contract.findMany({
      where,
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
            owner: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
            owner: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = contract.lease.ownerId === userId;
      const isTenant = contract.lease.tenant.userId === userId;
      const isCreator = contract.createdBy === userId;
      const isContractUser = contract.userId === userId;

      if (!isOwner && !isTenant && !isCreator && !isContractUser) {
        throw new ForbiddenException('Access denied to this contract');
      }
    }

    return contract;
  }

  async findByLease(leaseId: string, userId: string, userRole: string) {
    // Verify lease exists
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenant: true,
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = lease.ownerId === userId;
      const isTenant = lease.tenant.userId === userId;

      if (!isOwner && !isTenant) {
        throw new ForbiddenException(
          'Access denied to view contract for this lease',
        );
      }
    }

    const contract = await this.prisma.contract.findUnique({
      where: { leaseId },
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
            owner: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found for this lease');
    }

    return contract;
  }

  async update(
    id: string,
    updateContractDto: UpdateContractDto,
    userId: string,
    userRole: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check access rights (only creator, owner or admin)
    if (userRole !== 'admin') {
      const isOwner = contract.lease.ownerId === userId;
      const isCreator = contract.createdBy === userId;

      if (!isOwner && !isCreator) {
        throw new ForbiddenException(
          'Only contract creator, property owner or admin can update contract',
        );
      }
    }

    return this.prisma.contract.update({
      where: { id },
      data: updateContractDto,
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
            owner: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async sign(
    id: string,
    userId: string,
    userRole: string,
    signUserId?: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check if already signed
    if (contract.signedAt) {
      throw new BadRequestException('Contract is already signed');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = contract.lease.ownerId === userId;
      const isTenant = contract.lease.tenant.userId === userId;

      if (!isOwner && !isTenant) {
        throw new ForbiddenException(
          'Only lease parties can sign the contract',
        );
      }
    }

    // Determine who is signing
    const signerUserId = signUserId || userId;

    return this.prisma.contract.update({
      where: { id },
      data: {
        signedAt: new Date(),
        userId: signerUserId,
      },
      include: {
        lease: {
          include: {
            property: true,
            tenant: true,
            owner: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string, userRole: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        lease: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check access rights (only creator, owner or admin)
    if (userRole !== 'admin') {
      const isOwner = contract.lease.ownerId === userId;
      const isCreator = contract.createdBy === userId;

      if (!isOwner && !isCreator) {
        throw new ForbiddenException(
          'Only contract creator, property owner or admin can delete contract',
        );
      }
    }

    // Cannot delete signed contract
    if (contract.signedAt) {
      throw new BadRequestException('Cannot delete a signed contract');
    }

    // Delete file from Cloudinary if exists
    if (contract.fileUrl) {
      try {
        // Extract public_id from Cloudinary URL
        const publicId = this.extractPublicIdFromUrl(contract.fileUrl);
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      } catch (error) {
        console.error('Failed to delete file from Cloudinary:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    return this.prisma.contract.delete({
      where: { id },
    });
  }

  async uploadFile(
    leaseId: string,
    file: Express.Multer.File,
    userId: string,
    userRole: string,
  ) {
    // Verify lease exists
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        contract: true,
        tenant: true,
      },
    });

    if (!lease) {
      throw new NotFoundException('Lease not found');
    }

    // Check access rights (only owner or admin)
    if (userRole !== 'admin' && lease.ownerId !== userId) {
      throw new ForbiddenException(
        'Only property owner or admin can upload contract',
      );
    }

    // Check if contract already exists
    if (lease.contract) {
      throw new BadRequestException('Contract already exists for this lease');
    }

    // Upload file to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(
      file.buffer,
      file.originalname,
      'contracts',
    );

    // Create contract with uploaded file
    return this.create(
      {
        leaseId,
        fileUrl: uploadResult.secure_url,
        createdBy: userId,
      },
      userId,
    );
  }

  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Extract public_id from Cloudinary URL
      // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/contracts/sample.pdf
      const matches = url.match(/\/contracts\/([^\.]+)/);
      return matches ? `contracts/${matches[1]}` : null;
    } catch (error) {
      return null;
    }
  }

  // =============================
  // AUTOMATIC CONTRACT GENERATION
  // =============================

  /**
   * Génère automatiquement un contrat PDF pour un bail
   * et le sauvegarde sur Cloudinary
   */
  async generateAndUploadContract(
    leaseId: string,
    userId: string,
    userRole: string,
  ) {
    // Verify lease exists
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        contract: true,
        tenant: true,
      },
    });

    if (!lease) {
      throw new NotFoundException('Bail non trouvé');
    }

    // Check access rights (only owner or admin)
    if (userRole !== 'admin' && lease.ownerId !== userId) {
      throw new ForbiddenException(
        'Seul le propriétaire ou un admin peut générer le contrat',
      );
    }

    // Check if contract already exists
    if (lease.contract) {
      throw new BadRequestException('Un contrat existe déjà pour ce bail');
    }

    // Generate PDF
    const pdfBuffer = await this.contractGenerator.generateContractPDF(leaseId);

    // Upload to Cloudinary
    const filename = `contract-${leaseId}-${Date.now()}.pdf`;
    const uploadResult = await this.cloudinaryService.uploadFile(
      pdfBuffer,
      filename,
      'contracts',
    );

    // Create contract record
    return this.create(
      {
        leaseId,
        fileUrl: uploadResult.secure_url,
        createdBy: userId,
      },
      userId,
    );
  }

  /**
   * Récupère le HTML du contrat pour prévisualisation
   */
  async getContractHTML(leaseId: string, userId: string, userRole: string) {
    // Verify lease exists
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenant: true,
      },
    });

    if (!lease) {
      throw new NotFoundException('Bail non trouvé');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = lease.ownerId === userId;
      const isTenant = lease.tenant.userId === userId;

      if (!isOwner && !isTenant) {
        throw new ForbiddenException('Accès refusé pour voir ce contrat');
      }
    }

    return this.contractGenerator.generateContractHTML(leaseId);
  }

  /**
   * Télécharge le PDF du contrat
   */
  async downloadContractPDF(leaseId: string, userId: string, userRole: string) {
    // Verify lease exists
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenant: true,
      },
    });

    if (!lease) {
      throw new NotFoundException('Bail non trouvé');
    }

    // Check access rights
    if (userRole !== 'admin') {
      const isOwner = lease.ownerId === userId;
      const isTenant = lease.tenant.userId === userId;

      if (!isOwner && !isTenant) {
        throw new ForbiddenException(
          'Accès refusé pour télécharger ce contrat',
        );
      }
    }

    return this.contractGenerator.generateContractPDF(leaseId);
  }
}
