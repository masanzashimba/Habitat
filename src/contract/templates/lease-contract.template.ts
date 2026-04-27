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

  return `<div class="contract-container">
  <div class="header" style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 20px;">
    <h1 style="font-size: 24pt; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase;">Contrat de Bail d'Habitation</h1>
    <div class="contract-number" style="font-size: 11pt; color: #666; margin-top: 10px;">N° ${data.contractNumber}</div>
    <div style="margin-top: 10px; font-size: 11pt;">
      République Démocratique du Congo
    </div>
  </div>

  <div class="section" style="margin-bottom: 25px;">
    <div class="section-title" style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; border-bottom: 2px solid #333; padding-bottom: 5px;">Entre les soussignés</div>
    
    <div class="parties" style="display: flex; justify-content: space-between; margin-bottom: 30px; gap: 20px;">
      <div class="party" style="flex: 1; padding: 15px; border: 1px solid #333;">
        <div class="party-title" style="font-weight: bold; font-size: 13pt; margin-bottom: 10px; text-align: center; text-transform: uppercase;">Le Bailleur</div>
        <div class="party-info" style="margin: 5px 0;"><strong>Nom :</strong> ${data.landlord.fullName}</div>
        ${data.landlord.companyName ? `<div class="party-info" style="margin: 5px 0;"><strong>Société :</strong> ${data.landlord.companyName}</div>` : ''}
        ${data.landlord.companyId ? `<div class="party-info" style="margin: 5px 0;"><strong>N° Entreprise :</strong> ${data.landlord.companyId}</div>` : ''}
        <div class="party-info" style="margin: 5px 0;"><strong>Email :</strong> ${data.landlord.email}</div>
        ${data.landlord.phone ? `<div class="party-info" style="margin: 5px 0;"><strong>Téléphone :</strong> ${data.landlord.phone}</div>` : ''}
        ${data.landlord.address ? `<div class="party-info" style="margin: 5px 0;"><strong>Adresse :</strong> ${data.landlord.address}, ${data.landlord.city || 'Kinshasa'}</div>` : ''}
      </div>
      
      <div class="party" style="flex: 1; padding: 15px; border: 1px solid #333;">
        <div class="party-title" style="font-weight: bold; font-size: 13pt; margin-bottom: 10px; text-align: center; text-transform: uppercase;">Le Locataire</div>
        <div class="party-info" style="margin: 5px 0;"><strong>Nom :</strong> ${data.tenant.fullName}</div>
        ${data.tenant.nationalId ? `<div class="party-info" style="margin: 5px 0;"><strong>N° Carte d'identité :</strong> ${data.tenant.nationalId}</div>` : ''}
        <div class="party-info" style="margin: 5px 0;"><strong>Email :</strong> ${data.tenant.email}</div>
        ${data.tenant.phone ? `<div class="party-info" style="margin: 5px 0;"><strong>Téléphone :</strong> ${data.tenant.phone}</div>` : ''}
        ${data.tenant.occupation ? `<div class="party-info" style="margin: 5px 0;"><strong>Profession :</strong> ${data.tenant.occupation}</div>` : ''}
        ${data.tenant.employer ? `<div class="party-info" style="margin: 5px 0;"><strong>Employeur :</strong> ${data.tenant.employer}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="section" style="margin-bottom: 25px;">
    <div class="section-title" style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; border-bottom: 2px solid #333; padding-bottom: 5px;">Objet du Contrat</div>
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 1 : Désignation du bien loué</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">Le bailleur donne en location au locataire qui accepte, un bien immobilier situé à :</p>
        <div class="property-details" style="background: #f5f5f5; padding: 15px; border-left: 4px solid #333; margin: 15px 0;">
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

  <div class="section" style="margin-bottom: 25px;">
    <div class="section-title" style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; border-bottom: 2px solid #333; padding-bottom: 5px;">Durée du Bail</div>
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 2 : Durée</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">Le présent bail est consenti et accepté pour une durée de <span style="background: #ffffcc; padding: 2px 5px;">${data.duration.duration}</span>, 
        prenant effet le <span style="background: #ffffcc; padding: 2px 5px;">${formatDate(data.duration.startDate)}</span>
        ${data.duration.endDate ? ` et se terminant le <span style="background: #ffffcc; padding: 2px 5px;">${formatDate(data.duration.endDate)}</span>` : ' à durée indéterminée'}.</p>
        
        ${
          !data.duration.endDate
            ? `
        <p style="margin-bottom: 1em;">Le bail étant à durée indéterminée, chaque partie pourra y mettre fin moyennant un préavis de trois (3) mois 
        notifié par lettre recommandée avec accusé de réception.</p>
        `
            : ''
        }
      </div>
    </div>
  </div>

  <div class="section" style="margin-bottom: 25px;">
    <div class="section-title" style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; border-bottom: 2px solid #333; padding-bottom: 5px;">Conditions Financières</div>
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 3 : Loyer et charges</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">Le présent bail est consenti et accepté moyennant un loyer mensuel de :</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <th style="border: 1px solid #333; padding: 10px; text-align: left; background: #333; color: #fff; font-weight: bold;">Désignation</th>
            <th style="border: 1px solid #333; padding: 10px; text-align: left; background: #333; color: #fff; font-weight: bold;">Montant</th>
          </tr>
          <tr>
            <td style="border: 1px solid #333; padding: 10px; text-align: left;">Loyer mensuel</td>
            <td style="border: 1px solid #333; padding: 10px; text-align: left;"><strong>${formatCurrency(data.financial.rentAmount, data.financial.currency)}</strong></td>
          </tr>
          <tr>
            <td style="border: 1px solid #333; padding: 10px; text-align: left;">Garantie locative (Caution)</td>
            <td style="border: 1px solid #333; padding: 10px; text-align: left;"><strong>${formatCurrency(data.financial.deposit, data.financial.currency)}</strong></td>
          </tr>
          ${
            data.financial.securityDepositMonths
              ? `
          <tr>
            <td style="border: 1px solid #333; padding: 10px; text-align: left;">Nombre de mois de garantie</td>
            <td style="border: 1px solid #333; padding: 10px; text-align: left;">${data.financial.securityDepositMonths} mois</td>
          </tr>
          `
              : ''
          }
          ${
            data.financial.commissionMonths
              ? `
          <tr>
            <td style="border: 1px solid #333; padding: 10px; text-align: left;">Commission d'agence</td>
            <td style="border: 1px solid #333; padding: 10px; text-align: left;">${data.financial.commissionMonths} mois de loyer</td>
          </tr>
          `
              : ''
          }
        </table>
        
        <p style="margin-bottom: 1em;">Le loyer est payable d'avance, au plus tard le <span style="background: #ffffcc; padding: 2px 5px;">${data.financial.paymentDay}</span> de chaque mois, 
        par virement bancaire ou tout autre moyen convenu entre les parties.</p>
      </div>
    </div>
    
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 4 : Garantie locative</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">Le locataire verse au bailleur, à la signature du présent contrat, une garantie locative d'un montant de 
        <span style="background: #ffffcc; padding: 2px 5px;">${formatCurrency(data.financial.deposit, data.financial.currency)}</span>.</p>
        
        <p style="margin-bottom: 1em;">Cette garantie sera restituée au locataire dans un délai de trente (30) jours suivant la restitution des lieux, 
        déduction faite, le cas échéant, des sommes restant dues et des frais de remise en état des lieux.</p>
      </div>
    </div>
  </div>

  <div class="section" style="margin-bottom: 25px;">
    <div class="section-title" style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; border-bottom: 2px solid #333; padding-bottom: 5px;">Obligations des Parties</div>
    
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 5 : Obligations du bailleur</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">Le bailleur s'engage à :</p>
        <ul style="margin: 1em 0; padding-left: 2em;">
          <li style="margin-bottom: 0.5em;">Délivrer au locataire le logement en bon état d'usage et de réparation</li>
          <li style="margin-bottom: 0.5em;">Assurer au locataire la jouissance paisible du logement</li>
          <li style="margin-bottom: 0.5em;">Entretenir les locaux en état de servir à l'usage prévu</li>
          <li style="margin-bottom: 0.5em;">Effectuer les réparations autres que locatives</li>
        </ul>
      </div>
    </div>
    
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 6 : Obligations du locataire</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">Le locataire s'engage à :</p>
        <ul style="margin: 1em 0; padding-left: 2em;">
          <li style="margin-bottom: 0.5em;">Payer le loyer aux termes convenus</li>
          <li style="margin-bottom: 0.5em;">User paisiblement des locaux loués suivant leur destination</li>
          <li style="margin-bottom: 0.5em;">Répondre des dégradations et pertes qui surviennent pendant la durée du bail</li>
          <li style="margin-bottom: 0.5em;">Entretenir le logement et effectuer les réparations locatives</li>
          <li style="margin-bottom: 0.5em;">Ne pas transformer les lieux loués sans l'accord écrit du bailleur</li>
          <li style="margin-bottom: 0.5em;">Souscrire une assurance habitation couvrant les risques locatifs</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="section" style="margin-bottom: 25px;">
    <div class="section-title" style="font-size: 14pt; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; border-bottom: 2px solid #333; padding-bottom: 5px;">Dispositions Diverses</div>
    
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 7 : État des lieux</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">Un état des lieux contradictoire sera établi lors de la remise des clés et lors de la restitution du logement. 
        Il fera partie intégrante du présent contrat.</p>
      </div>
    </div>
    
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 8 : Résiliation</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">En cas de manquement par l'une des parties à ses obligations, et un mois après un commandement ou une mise en demeure 
        restée infructueuse, le présent bail pourra être résilié de plein droit si bon semble à la partie lésée.</p>
      </div>
    </div>
    
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 9 : Élection de domicile</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">Pour l'exécution des présentes, les parties font élection de domicile en leurs adresses respectives indiquées ci-dessus.</p>
      </div>
    </div>
    
    <div class="article" style="margin-bottom: 20px;">
      <div class="article-title" style="font-weight: bold; margin-bottom: 10px; font-size: 13pt;">Article 10 : Litiges</div>
      <div class="article-content" style="text-align: justify; margin-left: 20px;">
        <p style="margin-bottom: 1em;">Tout litige relatif à l'interprétation ou à l'exécution du présent contrat sera soumis aux tribunaux compétents 
        de Kinshasa, République Démocratique du Congo.</p>
      </div>
    </div>
  </div>

  <div class="signatures" style="margin-top: 50px; display: flex; justify-content: space-between; gap: 20px;">
    <div class="signature-block" style="text-align: center; flex: 1; margin: 0 20px;">
      <div><strong>Le Bailleur</strong></div>
      <div>${data.landlord.fullName}</div>
      <div class="signature-line" style="border-top: 2px solid #000; margin-top: 80px; padding-top: 10px;">
        Signature
      </div>
      <div style="margin-top: 10px; font-size: 10pt;">
        Date : ${formatDate(data.signatureDate)}
      </div>
    </div>
    
    <div class="signature-block" style="text-align: center; flex: 1; margin: 0 20px;">
      <div><strong>Le Locataire</strong></div>
      <div>${data.tenant.fullName}</div>
      <div class="signature-line" style="border-top: 2px solid #000; margin-top: 80px; padding-top: 10px;">
        Signature
      </div>
      <div style="margin-top: 10px; font-size: 10pt;">
        Date : ${formatDate(data.signatureDate)}
      </div>
    </div>
  </div>

  <div class="footer" style="margin-top: 50px; text-align: center; font-size: 10pt; color: #666; border-top: 1px solid #ccc; padding-top: 20px;">
    <p style="margin-bottom: 1em;">Fait à Kinshasa, le ${formatDate(data.signatureDate)}</p>
    <p style="margin-bottom: 1em;">En deux exemplaires originaux, dont un pour chaque partie.</p>
    <p style="margin-top: 20px; font-size: 9pt;">
      Document généré par LogeMoi - Plateforme de gestion immobilière<br>
      Référence : ${data.contractNumber}
    </p>
  </div>
</div>`.trim();
};
