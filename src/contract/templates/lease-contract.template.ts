export interface LeaseContractData {
  // Informations du bail
  leaseId: string;
  contractNumber: string;
  signatureDate: string;

  // Informations du bailleur (propriétaire)
  landlord: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    companyName?: string;
    companyId?: string;
  };

  // Informations du locataire
  tenant: {
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    nationalId?: string;
    occupation?: string;
    employer?: string;
  };

  // Informations de la propriété
  property: {
    title: string;
    address: string;
    commune: string;
    quartier: string;
    avenue: string;
    number?: string;
    city: string;
    propertyType: string;
    bedrooms?: number;
    bathrooms?: number;
    surface?: string;
  };

  // Conditions financières
  financial: {
    rentAmount: number;
    currency: string;
    deposit: number;
    securityDepositMonths?: number;
    commissionMonths?: number;
    paymentDay: number;
  };

  // Durée du bail
  duration: {
    startDate: string;
    endDate?: string;
    duration: string;
  };
}

export const generateLeaseContractHTML = (data: LeaseContractData): string => {
  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString('fr-FR')} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrat de Bail - ${data.contractNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 21cm;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #000;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 24pt;
      font-weight: bold;
      margin: 0 0 10px 0;
      text-transform: uppercase;
    }
    
    .header .contract-number {
      font-size: 11pt;
      color: #666;
      margin-top: 10px;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 15px;
      text-transform: uppercase;
      border-bottom: 2px solid #333;
      padding-bottom: 5px;
    }
    
    .article {
      margin-bottom: 20px;
    }
    
    .article-title {
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 13pt;
    }
    
    .article-content {
      text-align: justify;
      margin-left: 20px;
    }
    
    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    
    .party {
      flex: 1;
      padding: 15px;
      border: 1px solid #333;
      margin: 0 10px;
    }
    
    .party-title {
      font-weight: bold;
      font-size: 13pt;
      margin-bottom: 10px;
      text-align: center;
      text-transform: uppercase;
    }
    
    .party-info {
      margin: 5px 0;
    }
    
    .property-details {
      background: #f5f5f5;
      padding: 15px;
      border-left: 4px solid #333;
      margin: 15px 0;
    }
    
    .financial-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    .financial-table th,
    .financial-table td {
      border: 1px solid #333;
      padding: 10px;
      text-align: left;
    }
    
    .financial-table th {
      background: #333;
      color: #fff;
      font-weight: bold;
    }
    
    .signatures {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    
    .signature-block {
      text-align: center;
      flex: 1;
      margin: 0 20px;
    }
    
    .signature-line {
      border-top: 2px solid #000;
      margin-top: 80px;
      padding-top: 10px;
    }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 10pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 20px;
    }
    
    .highlight {
      background: #ffffcc;
      padding: 2px 5px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Contrat de Bail d'Habitation</h1>
    <div class="contract-number">N° ${data.contractNumber}</div>
    <div style="margin-top: 10px; font-size: 11pt;">
      République Démocratique du Congo
    </div>
  </div>

  <div class="section">
    <div class="section-title">Entre les soussignés</div>
    
    <div class="parties">
      <div class="party">
        <div class="party-title">Le Bailleur</div>
        <div class="party-info"><strong>Nom :</strong> ${data.landlord.fullName}</div>
        ${data.landlord.companyName ? `<div class="party-info"><strong>Société :</strong> ${data.landlord.companyName}</div>` : ''}
        ${data.landlord.companyId ? `<div class="party-info"><strong>N° Entreprise :</strong> ${data.landlord.companyId}</div>` : ''}
        <div class="party-info"><strong>Email :</strong> ${data.landlord.email}</div>
        ${data.landlord.phone ? `<div class="party-info"><strong>Téléphone :</strong> ${data.landlord.phone}</div>` : ''}
        ${data.landlord.address ? `<div class="party-info"><strong>Adresse :</strong> ${data.landlord.address}, ${data.landlord.city || 'Kinshasa'}</div>` : ''}
      </div>
      
      <div class="party">
        <div class="party-title">Le Locataire</div>
        <div class="party-info"><strong>Nom :</strong> ${data.tenant.fullName}</div>
        ${data.tenant.nationalId ? `<div class="party-info"><strong>N° Carte d'identité :</strong> ${data.tenant.nationalId}</div>` : ''}
        <div class="party-info"><strong>Email :</strong> ${data.tenant.email}</div>
        ${data.tenant.phone ? `<div class="party-info"><strong>Téléphone :</strong> ${data.tenant.phone}</div>` : ''}
        ${data.tenant.occupation ? `<div class="party-info"><strong>Profession :</strong> ${data.tenant.occupation}</div>` : ''}
        ${data.tenant.employer ? `<div class="party-info"><strong>Employeur :</strong> ${data.tenant.employer}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Objet du Contrat</div>
    <div class="article">
      <div class="article-title">Article 1 : Désignation du bien loué</div>
      <div class="article-content">
        <p>Le bailleur donne en location au locataire qui accepte, un bien immobilier situé à :</p>
        <div class="property-details">
          <div><strong>Désignation :</strong> ${data.property.title}</div>
          <div><strong>Type :</strong> ${data.property.propertyType}</div>
          <div><strong>Adresse complète :</strong></div>
          <div style="margin-left: 20px;">
            Avenue ${data.property.avenue}${data.property.number ? ', N° ' + data.property.number : ''}<br>
            Quartier ${data.property.quartier}<br>
            Commune de ${data.property.commune}<br>
            Ville de ${data.property.city}
          </div>
          ${data.property.bedrooms ? `<div><strong>Chambres :</strong> ${data.property.bedrooms}</div>` : ''}
          ${data.property.bathrooms ? `<div><strong>Salles de bain :</strong> ${data.property.bathrooms}</div>` : ''}
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Durée du Bail</div>
    <div class="article">
      <div class="article-title">Article 2 : Durée</div>
      <div class="article-content">
        <p>Le présent bail est consenti et accepté pour une durée de <span class="highlight">${data.duration.duration}</span>, 
        prenant effet le <span class="highlight">${formatDate(data.duration.startDate)}</span>
        ${data.duration.endDate ? ` et se terminant le <span class="highlight">${formatDate(data.duration.endDate)}</span>` : ' à durée indéterminée'}.</p>
        
        ${
          !data.duration.endDate
            ? `
        <p>Le bail étant à durée indéterminée, chaque partie pourra y mettre fin moyennant un préavis de trois (3) mois 
        notifié par lettre recommandée avec accusé de réception.</p>
        `
            : ''
        }
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Conditions Financières</div>
    <div class="article">
      <div class="article-title">Article 3 : Loyer et charges</div>
      <div class="article-content">
        <p>Le présent bail est consenti et accepté moyennant un loyer mensuel de :</p>
        
        <table class="financial-table">
          <tr>
            <th>Désignation</th>
            <th>Montant</th>
          </tr>
          <tr>
            <td>Loyer mensuel</td>
            <td><strong>${formatCurrency(data.financial.rentAmount, data.financial.currency)}</strong></td>
          </tr>
          <tr>
            <td>Garantie locative (Caution)</td>
            <td><strong>${formatCurrency(data.financial.deposit, data.financial.currency)}</strong></td>
          </tr>
          ${
            data.financial.securityDepositMonths
              ? `
          <tr>
            <td>Nombre de mois de garantie</td>
            <td>${data.financial.securityDepositMonths} mois</td>
          </tr>
          `
              : ''
          }
          ${
            data.financial.commissionMonths
              ? `
          <tr>
            <td>Commission d'agence</td>
            <td>${data.financial.commissionMonths} mois de loyer</td>
          </tr>
          `
              : ''
          }
        </table>
        
        <p>Le loyer est payable d'avance, au plus tard le <span class="highlight">${data.financial.paymentDay}</span> de chaque mois, 
        par virement bancaire ou tout autre moyen convenu entre les parties.</p>
      </div>
    </div>
    
    <div class="article">
      <div class="article-title">Article 4 : Garantie locative</div>
      <div class="article-content">
        <p>Le locataire verse au bailleur, à la signature du présent contrat, une garantie locative d'un montant de 
        <span class="highlight">${formatCurrency(data.financial.deposit, data.financial.currency)}</span>.</p>
        
        <p>Cette garantie sera restituée au locataire dans un délai de trente (30) jours suivant la restitution des lieux, 
        déduction faite, le cas échéant, des sommes restant dues et des frais de remise en état des lieux.</p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Obligations des Parties</div>
    
    <div class="article">
      <div class="article-title">Article 5 : Obligations du bailleur</div>
      <div class="article-content">
        <p>Le bailleur s'engage à :</p>
        <ul>
          <li>Délivrer au locataire le logement en bon état d'usage et de réparation</li>
          <li>Assurer au locataire la jouissance paisible du logement</li>
          <li>Entretenir les locaux en état de servir à l'usage prévu</li>
          <li>Effectuer les réparations autres que locatives</li>
        </ul>
      </div>
    </div>
    
    <div class="article">
      <div class="article-title">Article 6 : Obligations du locataire</div>
      <div class="article-content">
        <p>Le locataire s'engage à :</p>
        <ul>
          <li>Payer le loyer aux termes convenus</li>
          <li>User paisiblement des locaux loués suivant leur destination</li>
          <li>Répondre des dégradations et pertes qui surviennent pendant la durée du bail</li>
          <li>Entretenir le logement et effectuer les réparations locatives</li>
          <li>Ne pas transformer les lieux loués sans l'accord écrit du bailleur</li>
          <li>Souscrire une assurance habitation couvrant les risques locatifs</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dispositions Diverses</div>
    
    <div class="article">
      <div class="article-title">Article 7 : État des lieux</div>
      <div class="article-content">
        <p>Un état des lieux contradictoire sera établi lors de la remise des clés et lors de la restitution du logement. 
        Il fera partie intégrante du présent contrat.</p>
      </div>
    </div>
    
    <div class="article">
      <div class="article-title">Article 8 : Résiliation</div>
      <div class="article-content">
        <p>En cas de manquement par l'une des parties à ses obligations, et un mois après un commandement ou une mise en demeure 
        restée infructueuse, le présent bail pourra être résilié de plein droit si bon semble à la partie lésée.</p>
      </div>
    </div>
    
    <div class="article">
      <div class="article-title">Article 9 : Élection de domicile</div>
      <div class="article-content">
        <p>Pour l'exécution des présentes, les parties font élection de domicile en leurs adresses respectives indiquées ci-dessus.</p>
      </div>
    </div>
    
    <div class="article">
      <div class="article-title">Article 10 : Litiges</div>
      <div class="article-content">
        <p>Tout litige relatif à l'interprétation ou à l'exécution du présent contrat sera soumis aux tribunaux compétents 
        de Kinshasa, République Démocratique du Congo.</p>
      </div>
    </div>
  </div>

  <div class="signatures">
    <div class="signature-block">
      <div><strong>Le Bailleur</strong></div>
      <div>${data.landlord.fullName}</div>
      <div class="signature-line">
        Signature
      </div>
      <div style="margin-top: 10px; font-size: 10pt;">
        Date : ${formatDate(data.signatureDate)}
      </div>
    </div>
    
    <div class="signature-block">
      <div><strong>Le Locataire</strong></div>
      <div>${data.tenant.fullName}</div>
      <div class="signature-line">
        Signature
      </div>
      <div style="margin-top: 10px; font-size: 10pt;">
        Date : ${formatDate(data.signatureDate)}
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Fait à Kinshasa, le ${formatDate(data.signatureDate)}</p>
    <p>En deux exemplaires originaux, dont un pour chaque partie.</p>
    <p style="margin-top: 20px; font-size: 9pt;">
      Document généré par LogeMoi - Plateforme de gestion immobilière<br>
      Référence : ${data.contractNumber}
    </p>
  </div>
</body>
</html>
  `.trim();
};
