const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument({ margin: 50 });
doc.pipe(fs.createWriteStream('Cahier_des_Charges_Medico.pdf'));

// Title
doc.fontSize(20).text('Cahier des Charges - Plateforme Médicale "Medico"', { align: 'center' });
doc.moveDown();

// Info
doc.fontSize(12).text(`Date : 02 Février 2026`);
doc.text(`Client : M. Merouane Ben Makhlouf`);
doc.text(`Prestataire : Ilyes`);
doc.text(`Montant Total du Projet : 6 250 000 DZD`);
doc.moveDown();

doc.fontSize(16).text('1. Présentation du Projet', { underline: true });
doc.moveDown(0.5);
doc.fontSize(12).text('1.1 Contexte', { bold: true });
doc.text('Le projet "Medico" vise à développer une plateforme numérique complète et intégrée pour la gestion de l\'écosystème de santé. Cette solution connectera les patients, les médecins, les cliniques, les laboratoires et les centres de radiologie, facilitant ainsi l\'accès aux soins et optimisant les opérations médicales.');
doc.moveDown();

doc.text('1.2 Objectifs Principaux', { bold: true });
doc.text('• Pour les Patients : Simplifier la prise de rendez-vous, l\'accès aux dossiers médicaux et la téléconsultation.');
doc.text('• Pour les Médecins : Optimiser la gestion de l\'agenda, des dossiers patients et la communication.');
doc.text('• Pour les Cliniques/Hôpitaux : Gérer les flux de patients, les ressources (salles, équipements) et le personnel.');
doc.text('• Pour les Laboratoires/Radiologie : Digitaliser la réception des demandes et la transmission des résultats.');
doc.text('• Administration : Disposer d\'une vue d\'ensemble et d\'outils de gestion puissants pour superviser la plateforme.');
doc.moveDown();

doc.fontSize(16).text('2. Périmètre Fonctionnel (Scope)', { underline: true });
doc.moveDown(0.5);
doc.fontSize(12).text('2.1 Application Mobile (Patients & Professionnels)', { bold: true });
doc.moveDown(0.2);
doc.text('Module Patient:', { bold: true });
doc.text('• Authentification & Profil : Inscription via Email/Tél avec OTP, gestion du profil médical.');
doc.text('• Recherche & Prise de Rendez-vous : Recherche avancée, calendrier des disponibilités.');
doc.text('• Dossier Médical : Historique des visites, ordonnances numériques (PDF), résultats d\'examens.');
doc.text('• Système de Crédits : Porte-monnaie virtuel, achat de packs, paiement des consultations.');
doc.text('• Notifications : Rappels de RDV, alertes médicaments.');
doc.moveDown(0.5);

doc.text('Module Médecin:', { bold: true });
doc.text('• Agenda & Disponibilités : Gestion des créneaux, vacances, lieux multiples.');
doc.text('• Gestion des Rendez-vous : Liste du jour, dossiers patients, téléconsultation.');
doc.text('• Dossier Patient Électronique : Création de visites, ordonnances, notes privées.');
doc.text('• Tableau de Bord Financier : Suivi des gains, virements.');
doc.moveDown();

doc.fontSize(12).text('2.2 Portail Web & Opérations (Cliniques & Admin)', { bold: true });
doc.moveDown(0.2);
doc.text('Module Clinique & Hôpital:', { bold: true });
doc.text('• Gestion des Opérations : File d\'attente en temps réel, walk-ins, assignation des salles.');
doc.text('• Gestion du Personnel : Rôles et permissions (Infirmiers, Réceptionnistes, Médecins).');
doc.text('• Parcours Patient : Check-in, constantes, consultation, sortie.');
doc.moveDown(0.5);

doc.text('Module Laboratoire & Radiologie:', { bold: true });
doc.text('• Gestion des Demandes : Réception des ordonnances, planification.');
doc.text('• Traitement des Résultats : Saisie, upload de fichiers, transmission automatique.');
doc.moveDown();

doc.text('2.3 Panneau d\'Administration (Super Admin)', { bold: true });
doc.text('• Gestion des Utilisateurs : Validation des comptes pro, suspension/activation.');
doc.text('• Configuration Système : Spécialités, services, tarifs, codes promo.');
doc.text('• Surveillance : Logs d\'audit, monitoring technique, support tickets.');
doc.text('• Analytique Globale : Croissance, volume de RDV, flux financiers.');
doc.moveDown();

doc.fontSize(16).text('3. Architecture Technique', { underline: true });
doc.moveDown(0.5);
doc.fontSize(12).text('• Backend : Node.js avec TypeScript, PostgreSQL (Prisma).');
doc.text('• Application Mobile : React Native (Expo) pour iOS et Android.');
doc.text('• Application Web : Next.js pour le portail administratif et clinique.');
doc.text('• Sécurité : Chiffrement, JWT, Sauvegardes, Conformité médicale.');
doc.moveDown();

doc.addPage();

doc.fontSize(16).text('4. Planning de Développement (Phasage)', { underline: true });
doc.moveDown(0.5);
doc.fontSize(12).text('1. Fondations : Setup environnement, CI/CD.');
doc.text('2. Authentification : Login/inscription sécurisé.');
doc.text('3. Module Patient Core : Profils, données de santé.');
doc.text('4. Onboarding Pro : Vérification Médecins/Cliniques/Labs.');
doc.text('5. Moteur de Disponibilité : Algorithmes d\'agenda.');
doc.text('6. Système de Rendez-vous : Booking, report, check-in.');
doc.text('7. Dossiers Médicaux : Consultation, ordonnances PDF.');
doc.text('8. Système de Paiement : Crédits, transactions, promos.');
doc.text('9. Laboratoires & Radio : Flux demandes/résultats.');
doc.text('10. Communication : Messagerie, notifications Push/SMS.');
doc.text('11. Social & Analytics : Avis, Tableaux de bord.');
doc.text('12. Administration : Back-office complet.');
doc.text('13. Tests & Sécurité : Audit, optimisation.');
doc.text('14. Déploiement : Stores (iOS/Android) & Web.');
doc.moveDown();

doc.fontSize(16).text('5. Budget et Conditions Financières', { underline: true });
doc.moveDown(0.5);
doc.fontSize(12).text('Total : 6 250 000 DZD (Six Millions Deux Cent Cinquante Mille Dinars Algériens)', { bold: true });
doc.moveDown();
doc.text('Ce prix inclut le développement intégral, le design UI/UX, les tests, le déploiement et la garantie de maintenance corrective.');
doc.moveDown(2);

doc.text('Fait pour servir et valoir ce que de droit.', { italic: true });

doc.end();
console.log('PDF generated: Cahier_des_Charges_Medico.pdf');
