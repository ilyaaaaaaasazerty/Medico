const PDFDocument = require('pdfkit');
const fs = require('fs');

// Create document with margins
const doc = new PDFDocument({ margin: 40, size: 'A4' });
doc.pipe(fs.createWriteStream('Cahier_des_Charges_Medico_Pro_2Mois.pdf'));

// Colors
const PRIMARY_COLOR = '#003366'; // Dark Blue
const ACCENT_COLOR = '#0066cc'; // Lighter Blue
const GREY_COLOR = '#666666';

// --- HELPER FUNCTIONS ---
function drawHeader() {
    doc.rect(0, 0, 600, 100).fill(PRIMARY_COLOR);
    doc.fontSize(24).fillColor('white').font('Helvetica-Bold').text('MEDICO', 50, 40);
    doc.fontSize(10).font('Helvetica').text('DIGITAL HEALTHCARE ECOSYSTEM', 50, 70);
    
    doc.fontSize(10).text('OFFRE TECHNIQUE & FINANCIÈRE', 400, 40, { align: 'right' });
    doc.text('Date: 02 Février 2026', 400, 55, { align: 'right' });
    doc.fillColor('black'); // Reset
}

function drawSectionTitle(title, y) {
    doc.rect(40, y, 5, 20).fill(ACCENT_COLOR);
    doc.fontSize(16).fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(title.toUpperCase(), 55, y + 2);
    doc.fillColor('black');
}

// --- PAGE 1: EXECUTIVE SUMMARY ---
drawHeader();
doc.moveDown(8);

doc.fontSize(28).font('Helvetica-Bold').fillColor(PRIMARY_COLOR).text('CAHIER DES CHARGES', { align: 'center' });
doc.fontSize(14).font('Helvetica').fillColor(GREY_COLOR).text('PROJET DE DÉVELOPPEMENT ACCÉLÉRÉ (FAST-TRACK)', { align: 'center' });
doc.moveDown(2);

doc.fontSize(12).fillColor('black').text('CLIENT', { align: 'center', bold: true });
doc.fontSize(14).text('M. Merouane Ben Makhlouf', { align: 'center' });
doc.moveDown();

doc.fontSize(12).text('PRESTATAIRE', { align: 'center', bold: true });
doc.fontSize(14).text('Ilyes', { align: 'center' });
doc.moveDown(4);

// Budget Box
doc.rect(150, 450, 300, 60).stroke(PRIMARY_COLOR);
doc.fontSize(12).fillColor(PRIMARY_COLOR).text('BUDGET TOTAL FORFAITAIRE', 150, 465, { align: 'center', width: 300 });
doc.fontSize(16).font('Helvetica-Bold').text('6 250 000 DZD', 150, 485, { align: 'center', width: 300 });

// Duration Box
doc.rect(150, 520, 300, 40).stroke(GREY_COLOR);
doc.fontSize(12).fillColor(GREY_COLOR).font('Helvetica').text('DURÉE DE RÉALISATION: 8 SEMAINES (2 MOIS)', 150, 532, { align: 'center', width: 300 });

doc.addPage();

// --- PAGE 2: DETAILED PLANNING ---
drawSectionTitle('Planning Stratégique (2 Mois)', 50);

doc.font('Helvetica').fontSize(11).fillColor('black').text(
    'Pour respecter le délai de 2 mois, le projet est découpé en 4 "Sprints" intensifs de 2 semaines chacun. Cette méthodologie Agile garantit des livraisons fonctionnelles rapides.',
    40, 90, { width: 500 }
);

const startY = 140;
let currentY = startY;

// Table Headers
doc.rect(40, currentY, 515, 25).fill(PRIMARY_COLOR);
doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
doc.text('SPRINT / PHASE', 50, currentY + 8);
doc.text('LIVRABLES CLÉS', 250, currentY + 8);
doc.text('BUDGET (DZD)', 450, currentY + 8, { align: 'right' });
currentY += 25;

// Data
const sprints = [
    {
        title: "SPRINT 1 : FONDATIONS & CORE",
        time: "Semaines 1-2",
        items: [
            "• Architecture Système & Base de données",
            "• Authentification Sécurisée (JWT, OTP)",
            "• Profils: Patient, Médecin, Famille",
            "• Onboarding Cliniques & Labos"
        ],
        cost: "1 500 000"
    },
    {
        title: "SPRINT 2 : MOTEUR MÉDICAL",
        time: "Semaines 3-4",
        items: [
            "• Algorithmes de Disponibilité & Agenda",
            "• Prise de Rendez-vous & Check-in",
            "• Dossiers Médicaux & Consultations",
            "• Génération PDF (Ordonnances)"
        ],
        cost: "1 600 000"
    },
    {
        title: "SPRINT 3 : ECOSYSTÈME & OPS",
        time: "Semaines 5-6",
        items: [
            "• Système de Paiement & Crédits",
            "• Module Laboratoire (Demandes/Résultats)",
            "• Notifications & Messagerie",
            "• Back-office Admin (V1)"
        ],
        cost: "1 600 000"
    },
    {
        title: "SPRINT 4 : FINALISATION",
        time: "Semaines 7-8",
        items: [
            "• Analytics & Tableaux de bord",
            "• Tests de Charge & Sécurité (Audit)",
            "• Optimisation Performance",
            "• Déploiement Stores & Web"
        ],
        cost: "1 550 000"
    }
];

doc.fillColor('black');

sprints.forEach((sprint, index) => {
    const rowHeight = 80;
    
    // Row Background
    if (index % 2 === 0) doc.rect(40, currentY, 515, rowHeight).fill('#f0f5fa');
    
    // Sprint Title & Time
    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(11).text(sprint.title, 50, currentY + 10);
    doc.fillColor(GREY_COLOR).font('Helvetica-Oblique').fontSize(10).text(sprint.time, 50, currentY + 25);
    
    // Deliverables
    doc.fillColor('black').font('Helvetica').fontSize(10);
    let itemY = currentY + 10;
    sprint.items.forEach(item => {
        doc.text(item, 250, itemY);
        itemY += 12;
    });
    
    // Cost
    doc.font('Helvetica-Bold').text(sprint.cost, 450, currentY + 30, { align: 'right' });
    
    currentY += rowHeight;
});

// TOTAL ROW
doc.rect(40, currentY, 515, 30).stroke(PRIMARY_COLOR);
doc.font('Helvetica-Bold').fontSize(12).fillColor(PRIMARY_COLOR);
doc.text('TOTAL INVESTISSEMENT', 50, currentY + 10);
doc.text('6 250 000 DZD', 450, currentY + 10, { align: 'right' });

doc.moveDown(4);

// --- CONDITIONS ---
drawSectionTitle('Conditions de Réalisation', currentY + 50);

const conditionsY = currentY + 80;
doc.font('Helvetica').fontSize(10).fillColor('black');
doc.text('Engagement Délais :', 50, conditionsY, { bold: true });
doc.text('Le délai de 8 semaines est impératif. Il implique une validation rapide des maquettes et des livrables par le client (max 48h).', 180, conditionsY, { width: 350 });

doc.text('Infrastructure :', 50, conditionsY + 30, { bold: true });
doc.text('Les coûts d\'hébergement (Cloud, Serveurs, Noms de domaine) restent à la charge du client.', 180, conditionsY + 30, { width: 350 });

doc.text('Modalités :', 50, conditionsY + 60, { bold: true });
doc.text('30% à la commande, 30% à la fin du Sprint 2, 40% à la livraison finale.', 180, conditionsY + 60, { width: 350 });

// Footer
doc.fontSize(8).fillColor(GREY_COLOR).text('Document confidentiel - Medico 2026', 50, 750, { align: 'center', width: 500 });

doc.end();
console.log('Professional PDF generated: Cahier_des_Charges_Medico_Pro_2Mois.pdf');
