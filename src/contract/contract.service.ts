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
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ContractService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly contractGenerator: ContractGeneratorService,
    private readonly notificationService: NotificationService,
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

    // 🔥 IMPORTANT: Associer le tenant à un utilisateur pour qu'il puisse voir le contrat
    if (lease.tenant && !lease.tenant.userId) {
      // Si le tenant n'a pas de userId, essayer de le trouver par email
      if (lease.tenant.email) {
        const tenantUser = await this.prisma.user.findUnique({
          where: { email: lease.tenant.email },
        });

        if (tenantUser) {
          // Associer le tenant à l'utilisateur
          await this.prisma.tenant.update({
            where: { id: lease.tenant.id },
            data: { userId: tenantUser.id },
          });
          console.log(
            `✅ Tenant ${lease.tenant.id} associé à l'utilisateur ${tenantUser.id}`,
          );
        } else {
          console.warn(
            `⚠️ Aucun utilisateur trouvé avec l'email ${lease.tenant.email}`,
          );
        }
      }
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

    // 🔍 Debug: Log des paramètres
    console.log('🔍 findAll - userId:', userId, 'userRole:', userRole);

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

    // 🔍 Debug: Log du filtre
    console.log('🔍 findAll - where:', JSON.stringify(where, null, 2));

    const contracts = await this.prisma.contract.findMany({
      where,
      include: {
        lease: {
          include: {
            property: {
              include: {
                address: true,
                images: {
                  orderBy: {
                    isPrimary: 'desc',
                  },
                },
              },
            },
            tenant: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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

    // 🔍 Debug: Log des résultats
    console.log('🔍 findAll - contracts found:', contracts.length);
    if (contracts.length > 0) {
      console.log('🔍 First contract tenant:', contracts[0].lease.tenant);
    }

    return contracts;
  }

  async findSigned(userId: string, userRole: string) {
    let where: any = {
      signedAt: {
        not: null,
      },
    };

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
    // Admin sees all signed contracts (no additional filter)

    return this.prisma.contract.findMany({
      where,
      include: {
        lease: {
          include: {
            property: {
              include: {
                address: true,
                images: {
                  orderBy: {
                    isPrimary: 'desc',
                  },
                },
              },
            },
            tenant: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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

  async findUnsigned(userId: string, userRole: string) {
    let where: any = {
      signedAt: null,
    };

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
    // Admin sees all unsigned contracts (no additional filter)

    return this.prisma.contract.findMany({
      where,
      include: {
        lease: {
          include: {
            property: {
              include: {
                address: true,
                images: {
                  orderBy: {
                    isPrimary: 'desc',
                  },
                },
              },
            },
            tenant: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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

  async getContractsSummary(userId: string, userRole: string) {
    // Build base filter based on role
    let baseWhere: any = {};

    if (userRole === 'owner') {
      baseWhere.lease = {
        ownerId: userId,
      };
    } else if (userRole === 'tenant') {
      baseWhere.lease = {
        tenant: {
          userId,
        },
      };
    }
    // Admin sees all contracts (no filter)

    // Get signed contracts
    const signedContracts = await this.prisma.contract.findMany({
      where: {
        ...baseWhere,
        signedAt: {
          not: null,
        },
      },
      include: {
        lease: {
          include: {
            property: {
              include: {
                address: true,
                images: {
                  where: {
                    isPrimary: true,
                  },
                  take: 1,
                },
              },
            },
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
        signedAt: 'desc',
      },
    });

    // Get unsigned contracts
    const unsignedContracts = await this.prisma.contract.findMany({
      where: {
        ...baseWhere,
        signedAt: null,
      },
      include: {
        lease: {
          include: {
            property: {
              include: {
                address: true,
                images: {
                  where: {
                    isPrimary: true,
                  },
                  take: 1,
                },
              },
            },
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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

    // Calculate statistics
    const totalContracts = signedContracts.length + unsignedContracts.length;
    const signedCount = signedContracts.length;
    const unsignedCount = unsignedContracts.length;
    const signedPercentage =
      totalContracts > 0 ? (signedCount / totalContracts) * 100 : 0;

    return {
      summary: {
        total: totalContracts,
        signed: signedCount,
        unsigned: unsignedCount,
        signedPercentage: Math.round(signedPercentage * 100) / 100,
      },
      contracts: {
        signed: signedContracts,
        unsigned: unsignedContracts,
      },
    };
  }

  async findOne(id: string, userId: string, userRole: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        lease: {
          include: {
            property: {
              include: {
                address: true,
                images: {
                  orderBy: {
                    isPrimary: 'desc',
                  },
                },
              },
            },
            tenant: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
            property: {
              include: {
                address: true,
                images: {
                  orderBy: {
                    isPrimary: 'desc',
                  },
                },
              },
            },
            tenant: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
            property: true,
            owner: true,
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

    // Update contract
    const updatedContract = await this.prisma.contract.update({
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
                firstName: true,
                lastName: true,
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

    // Envoyer des notifications au locataire et au propriétaire
    try {
      // Notification au locataire
      if (updatedContract.lease.tenant.userId) {
        await this.notificationService.create({
          userId: updatedContract.lease.tenant.userId,
          title: 'Contrat de bail signé',
          message: `Le contrat de bail pour "${updatedContract.lease.property.title}" a été signé. Vous pouvez maintenant le consulter dans l'onglet Contrats de bail.`,
          type: 'contract_signed',
          data: {
            contractId: updatedContract.id,
            leaseId: updatedContract.leaseId,
            propertyTitle: updatedContract.lease.property.title,
            propertyId: updatedContract.lease.property.id,
          },
        });
      }

      // Notification au propriétaire
      await this.notificationService.create({
        userId: updatedContract.lease.ownerId,
        title: 'Contrat de bail signé',
        message: `Le contrat de bail pour "${updatedContract.lease.property.title}" a été signé. Le locataire peut maintenant consulter le contrat.`,
        type: 'contract_signed',
        data: {
          contractId: updatedContract.id,
          leaseId: updatedContract.leaseId,
          propertyTitle: updatedContract.lease.property.title,
          propertyId: updatedContract.lease.property.id,
          tenantName:
            `${updatedContract.lease.tenant.firstName || ''} ${updatedContract.lease.tenant.lastName || ''}`.trim() ||
            updatedContract.lease.tenant.email,
        },
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi des notifications:", error);
      // Ne pas bloquer si l'envoi des notifications échoue
    }

    return updatedContract;
  }

  async unsign(id: string, userId: string, userRole: string) {
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

    // Check if not signed
    if (!contract.signedAt) {
      throw new BadRequestException('Contract is not signed');
    }

    // Only admin can unsign
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admin can unsign a contract');
    }

    return this.prisma.contract.update({
      where: { id },
      data: {
        signedAt: null,
        userId: null,
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

      // Cannot delete signed contract (except for admin)
      if (contract.signedAt) {
        throw new BadRequestException(
          'Cannot delete a signed contract. Only admin can delete signed contracts.',
        );
      }
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

  // =============================
  // DEBUG METHODS
  // =============================
  async findTenantByUserId(userId: string) {
    return this.prisma.tenant.findFirst({
      where: { userId },
      include: {
        leases: {
          include: {
            contract: true,
          },
        },
      },
    });
  }

  async findAllContractsDebug() {
    return this.prisma.contract.findMany({
      include: {
        lease: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }
}
