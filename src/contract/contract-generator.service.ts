import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  LeaseContractData,
  generateLeaseContractHTML,
} from './templates/lease-contract.template';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ContractGeneratorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Génère les données du contrat depuis un bail
   */
  async generateContractData(leaseId: string): Promise<LeaseContractData> {
    // Récupérer toutes les informations du bail
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        property: {
          include: {
            address: true,
            user: true,
          },
        },
        tenant: true,
        owner: true,
      },
    });

    if (!lease) {
      throw new Error('Bail non trouvé');
    }

    // Générer le numéro de contrat
    const contractNumber = this.generateContractNumber(lease.id);

    // Calculer la durée du bail
    const duration = this.calculateLeaseDuration(
      lease.startDate,
      lease.endDate,
    );

    // Préparer les données du bailleur
    const landlord = {
      fullName:
        `${lease.owner.firstName || ''} ${lease.owner.lastName || ''}`.trim() ||
        'Non spécifié',
      email: lease.owner.email,
      phone: lease.owner.phone || undefined,
      address: lease.owner.address || undefined,
      city: lease.owner.city || 'Kinshasa',
      companyName: lease.owner.companyName || undefined,
      companyId: lease.owner.companyId || undefined,
    };

    // Préparer les données du locataire
    const tenant = {
      fullName:
        lease.tenant.firstName && lease.tenant.lastName
          ? `${lease.tenant.firstName} ${lease.tenant.lastName}`
          : 'Non spécifié',
      email: lease.tenant.email || 'Non spécifié',
      phone: lease.tenant.phone || undefined,
      address: lease.tenant.address || undefined,
      city: lease.tenant.city || 'Kinshasa',
    };

    // Préparer les données de la propriété
    const property = {
      title: lease.property.title,
      address: lease.property.address
        ? `${lease.property.address.number ? lease.property.address.number + ' ' : ''}${lease.property.address.avenue}, ${lease.property.address.quartier}`
        : 'Adresse non spécifiée',
      commune: lease.property.address?.commune || 'Non spécifié',
      quartier: lease.property.address?.quartier || 'Non spécifié',
      avenue: lease.property.address?.avenue || 'Non spécifié',
      number: lease.property.address?.number || undefined,
      city: lease.property.address?.city || 'Kinshasa',
      propertyType: this.translatePropertyType(lease.property.propertyType),
      bedrooms: lease.property.bedrooms || undefined,
      bathrooms: lease.property.bathrooms || undefined,
    };

    // Préparer les conditions financières
    const financial = {
      rentAmount: Number(lease.rentAmount),
      currency: lease.currency,
      deposit: Number(lease.deposit || 0),
      securityDepositMonths: lease.property.securityDepositMonths || undefined,
      commissionMonths: lease.property.commissionMonths || undefined,
      paymentDay: 5, // Jour de paiement par défaut
    };

    // Préparer la durée
    const durationData = {
      startDate: lease.startDate.toISOString(),
      endDate: lease.endDate?.toISOString() || undefined,
      duration,
    };

    return {
      leaseId: lease.id,
      contractNumber,
      signatureDate: new Date().toISOString(),
      landlord,
      tenant,
      property,
      financial,
      duration: durationData,
    };
  }

  /**
   * Génère le HTML du contrat
   */
  async generateContractHTML(leaseId: string): Promise<string> {
    const contractData = await this.generateContractData(leaseId);
    return generateLeaseContractHTML(contractData);
  }

  /**
   * Génère le PDF du contrat
   */
  async generateContractPDF(leaseId: string): Promise<Buffer> {
    const html = await this.generateContractHTML(leaseId);

    // Lancer Puppeteer pour générer le PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Sauvegarde le PDF localement (temporaire)
   */
  async saveContractPDFLocally(leaseId: string): Promise<string> {
    const pdfBuffer = await this.generateContractPDF(leaseId);
    const uploadsDir = path.join(process.cwd(), 'uploads', 'contracts');

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `contract-${leaseId}-${Date.now()}.pdf`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, pdfBuffer);

    return filepath;
  }

  /**
   * Génère un numéro de contrat unique
   */
  private generateContractNumber(leaseId: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const shortId = leaseId.substring(0, 8).toUpperCase();

    return `BAIL-${year}${month}-${shortId}`;
  }

  /**
   * Calcule la durée du bail en texte
   */
  private calculateLeaseDuration(
    startDate: Date,
    endDate: Date | null,
  ): string {
    if (!endDate) {
      return 'durée indéterminée';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} jours`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      if (remainingMonths > 0) {
        return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
      }
      return `${years} an${years > 1 ? 's' : ''}`;
    }
  }

  /**
   * Traduit le type de propriété en français
   */
  private translatePropertyType(type: string): string {
    const translations: Record<string, string> = {
      APARTMENT: 'Appartement',
      HOUSE: 'Maison',
      STUDIO: 'Studio',
      VILLA: 'Villa',
      OFFICE: 'Bureau',
      SHOP: 'Commerce',
      WAREHOUSE: 'Entrepôt',
      LAND: 'Terrain',
    };

    return translations[type] || type;
  }
}
