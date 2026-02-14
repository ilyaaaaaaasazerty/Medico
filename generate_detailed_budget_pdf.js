const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50, size: 'A4' });
doc.pipe(fs.createWriteStream('Cahier_des_Charges_Medico_Detaille.pdf'));

// --- HEADER ---
doc.font('Helvetica-Bold').fontSize(22).text('Cahier des Charges Détaillé', { align: 'center' });
doc.fontSize(14).text('Plateforme Médicale "Medico"', { align: 'center' });
doc.moveDown();

doc.font('Helvetica').fontSize(10);
doc.text(`Date : 02 Février 2026`, { align: 'right' });
doc.text(`Client : M. Merouane Ben Makhlouf`, { align: 'right' });
doc.text(`Prestataire : Ilyes`, { align: 'right' });
doc.moveDown(2);

// --- 1. CONTEXTE ---
doc.font('Helvetica-Bold').fontSize(14).text('1. Synthèse du Projet', { underline: true });
doc.moveDown(0.5);
doc.font('Helvetica').fontSize(11).text(
  'Le projet consiste en la réalisation d\'une plateforme médicale complète (Mobile, Web, Backend) ' +
  'permettant la mise en relation et la gestion opérationnelle entre Patients, Médecins, Cliniques et Laboratoires. ' +
  'L\'objectif est de digitaliser le parcours de soin complet.'
);
doc.moveDown();

// --- 2. TABLEAU BUDGETAIRE ---
doc.font('Helvetica-Bold').fontSize(14).text('2. Détail Financier & Planning', { underline: true });
doc.moveDown(0.5);
doc.font('Helvetica').fontSize(11).text('Le budget total de 6 250 000 DZD est réparti selon les phases de développement, la complexité technique et le temps de mise en œuvre requis.');
doc.moveDown();

// Draw Table Header
const tableTop = doc.y;
const col1 = 50;  // Phase
const col2 = 350; // Durée
const col3 = 450; // Coût

doc.font('Helvetica-Bold').fontSize(10);
doc.text('Phase / Module', col1, tableTop);
doc.text('Durée Est.', col2, tableTop);
doc.text('Coût (DZD)', col3, tableTop);

doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

let y = tableTop + 25;
const rowHeight = 20;

const phases = [
  { name: "1. Fondations Techniques & Architecture", time: "1 sem", cost: "200,000" },
  { name: "2. Authentification & Sécurité Avancée", time: "2 sem", cost: "400,000" },
  { name: "3. Module Patient (Profils, Santé, Famille)", time: "3 sem", cost: "600,000" },
  { name: "4. Module Médecin (Onboarding, Vérification)", time: "2 sem", cost: "400,000" },
  { name: "5. Module Clinique & Labo (Gestion Structure)", time: "2 sem", cost: "400,000" },
  { name: "6. Moteur de Disponibilité & Algorithmes", time: "2 sem", cost: "400,000" },
  { name: "7. Système de Rendez-vous (Booking, Check-in)", time: "3 sem", cost: "600,000" },
  { name: "8. Dossiers Médicaux & Ordonnances PDF", time: "2 sem", cost: "400,000" },
  { name: "9. Système de Paiement & Gestion Crédits", time: "2 sem", cost: "400,000" },
  { name: "10. Module Laboratoire & Résultats d'Examens", time: "2 sem", cost: "400,000" },
  { name: "11. Communication (Chat, Notifs, SMS)", time: "2 sem", cost: "400,000" },
  { name: "12. Analytics, Avis & Social", time: "2 sem", cost: "350,000" },
  { name: "13. Panneau d'Administration (Super Admin)", time: "3 sem", cost: "600,000" },
  { name: "14. Tests QA, Audit Sécurité & Déploiement", time: "4 sem", cost: "700,000" },
];

doc.font('Helvetica').fontSize(10);

phases.forEach((phase, i) => {
  // Zebra striping
  if (i % 2 === 0) {
    doc.rect(50, y - 5, 500, rowHeight).fill('#f5f5f5');
    doc.fillColor('black');
  }
  
  doc.text(phase.name, col1 + 5, y);
  doc.text(phase.time, col2, y);
  doc.text(phase.cost, col3, y);
  y += rowHeight;
});

doc.moveTo(50, y).lineTo(550, y).stroke();
y += 10;

// Total
doc.font('Helvetica-Bold').fontSize(12);
doc.text('TOTAL GLOBAL', col1 + 5, y);
doc.text('~ 32 sem', col2, y);
doc.text('6 250 000 DZD', col3, y);

doc.moveDown(3);

// --- 3. LIVRABLES ---
doc.font('Helvetica-Bold').fontSize(14).text('3. Livrables Inclus', { underline: true });
doc.moveDown(0.5);
doc.font('Helvetica').fontSize(11);
doc.text('• Code Source complet (Mobile, Web, Backend).');
doc.text('• Documentation technique et manuels utilisateurs.');
doc.text('• Configuration des serveurs de production et bases de données.');
doc.text('• Publication sur les stores (App Store & Google Play) et déploiement Web.');
doc.text('• Formation à l\'utilisation du panneau d\'administration.');
doc.moveDown();

// --- 4. CONDITIONS ---
doc.font('Helvetica-Bold').fontSize(14).text('4. Conditions', { underline: true });
doc.moveDown(0.5);
doc.font('Helvetica').fontSize(11);
doc.text('• Paiement : 30% au démarrage, 40% à mi-parcours, 30% à la livraison.');
doc.text('• Maintenance : Garantie corrective incluse pour 6 mois après livraison.');
doc.moveDown(2);

doc.font('Helvetica-Oblique').fontSize(10).text('Ce document détaille la répartition financière du projet Medico et sert de référence pour la facturation.', { align: 'center' });

doc.end();
console.log('PDF Detailed Budget generated: Cahier_des_Charges_Medico_Detaille.pdf');
