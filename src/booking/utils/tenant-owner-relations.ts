import { PrismaService } from '../../prisma.service';

export class TenantOwnerRelations {
  constructor(private prisma: PrismaService) {}

  async hasBookingRelation(
    tenantId: string,
    ownerId: string,
  ): Promise<boolean> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        userId: tenantId,
        property: {
          userId: ownerId,
        },
      },
    });
    return !!booking;
  }

  async getTenantOwnerRelations(tenantId: string) {
    return this.prisma.booking.findMany({
      where: { userId: tenantId },
      include: {
        property: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }
}
