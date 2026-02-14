# Cahier des Charges - Plateforme Médicale "Medico"

**Date :** 02 Février 2026
**Client :** M. Merouane Ben Makhlouf
**Prestataire :** Ilyes
**Montant Total du Projet :** 6 250 000 DZD

---

## 1. Présentation du Projet

### 1.1 Contexte
Le projet "Medico" vise à développer une plateforme numérique complète et intégrée pour la gestion de l'écosystème de santé. Cette solution connectera les patients, les médecins, les cliniques, les laboratoires et les centres de radiologie, facilitant ainsi l'accès aux soins et optimisant les opérations médicales.

### 1.2 Objectifs Principaux
*   **Pour les Patients :** Simplifier la prise de rendez-vous, l'accès aux dossiers médicaux et la téléconsultation.
*   **Pour les Médecins :** Optimiser la gestion de l'agenda, des dossiers patients et la communication.
*   **Pour les Cliniques/Hôpitaux :** Gérer les flux de patients, les ressources (salles, équipements) et le personnel.
*   **Pour les Laboratoires/Radiologie :** Digitaliser la réception des demandes et la transmission des résultats.
*   **Administration :** Disposer d'une vue d'ensemble et d'outils de gestion puissants pour superviser la plateforme.

---

## 2. Périmètre Fonctionnel (Scope)

La solution se compose de trois applications interconnectées (Mobile, Web, Backend) couvrant les modules suivants :

### 2.1 Application Mobile (Patients & Professionnels)

#### Module Patient
*   **Authentification & Profil :** Inscription via Email/Tél avec OTP, gestion du profil médical (allergies, antécédents, famille).
*   **Recherche & Prise de Rendez-vous :** Recherche avancée (spécialité, localisation), calendrier des disponibilités, réservation (présentiel/vidéo).
*   **Dossier Médical :** Historique des visites, ordonnances numériques (PDF), résultats d'examens, suivi des constantes vitales.
*   **Système de Crédits :** Porte-monnaie virtuel, achat de packs de crédits, paiement des consultations.
*   **Notifications :** Rappels de RDV (Push/SMS), alertes médicaments, réception de résultats.

#### Module Médecin
*   **Agenda & Disponibilités :** Gestion fine des créneaux horaires, vacances, lieux de consultation multiples.
*   **Gestion des Rendez-vous :** Liste du jour, dossiers patients, téléconsultation intégrée.
*   **Dossier Patient Électronique :** Création de visites, rédaction d'ordonnances, notes privées.
*   **Tableau de Bord Financier :** Suivi des gains, demande de virements.

### 2.2 Portail Web & Opérations (Cliniques & Admin)

#### Module Clinique & Hôpital
*   **Gestion des Opérations :** Gestion de la file d'attente en temps réel, enregistrement des "Walk-ins", assignation des salles.
*   **Gestion du Personnel :** Rôles et permissions (Infirmiers, Réceptionnistes, Médecins).
*   **Parcours Patient :** Check-in, prise de constantes, consultation, sortie.
*   **Statistiques :** Rapports d'activité, taux d'occupation, revenus.

#### Module Laboratoire & Radiologie
*   **Gestion des Demandes :** Réception des ordonnances, planification des prélèvements/examens.
*   **Traitement des Résultats :** Saisie des résultats, upload de fichiers/images, transmission automatique au patient/médecin.

### 2.3 Panneau d'Administration (Super Admin)
*   **Gestion des Utilisateurs :** Validation des comptes professionnels (vérification de licence), suspension/activation.
*   **Configuration Système :** Gestion des spécialités, services, tarifs, codes promo.
*   **Surveillance :** Logs d'audit, monitoring technique, support tickets.
*   **Analytique Globale :** Croissance utilisateurs, volume de RDV, flux financiers.

---

## 3. Architecture Technique

### 3.1 Stack Technologique
*   **Backend :** Node.js avec TypeScript, Base de données PostgreSQL (Prisma ORM).
*   **Application Mobile :** React Native (Expo) pour iOS et Android.
*   **Application Web :** Next.js (React) pour le portail administratif et clinique.
*   **Infrastructure :** Architecture Cloud, Stockage de fichiers sécurisé (S3), CDN.

### 3.2 Sécurité & Conformité
*   Chiffrement des données sensibles (mots de passe, données de santé).
*   Authentification forte (JWT, Refresh Tokens).
*   Sauvegardes automatiques et régulières.
*   Respect des normes de confidentialité des données médicales.

---

## 4. Planning de Développement (Phasage)

Le projet sera livré en **14 phases** distinctes :

1.  **Fondations :** Setup de l'environnement, CI/CD, structure Monorepo.
2.  **Authentification :** Système complet de login/inscription sécurisé.
3.  **Module Patient Core :** Profils, données de santé, gestion familiale.
4.  **Onboarding Professionnels :** Inscription et vérification Médecins/Cliniques/Labs.
5.  **Moteur de Disponibilité :** Algorithmes de gestion d'agenda complexes.
6.  **Système de Rendez-vous :** Booking, annulation, report, check-in.
7.  **Dossiers Médicaux :** Logique de consultation, ordonnances PDF.
8.  **Système de Paiement :** Gestion des crédits, transactions, codes promo.
9.  **Laboratoires & Radio :** Flux complet de demande et résultat d'examens.
10. **Communication :** Messagerie in-app, SMS, Emails, Notifications Push.
11. **Social & Analytics :** Avis, Parrainage, Tableaux de bord de performance.
12. **Administration Système :** Back-office complet pour la gestion de la plateforme.
13. **Tests & Sécurité :** Audit, optimisation, tests de charge.
14. **Déploiement :** Mise en production sur les stores (App Store, Play Store) et Web.

---

## 5. Budget et Conditions Financières

**Prestataire :** Ilyes
**Client :** M. Merouane Ben Makhlouf

Le coût total forfaitaire pour la réalisation complète du projet "Medico" tel que décrit ci-dessus est fixé à :

### **Total : 6 250 000 DZD (Six Millions Deux Cent Cinquante Mille Dinars Algériens)**

**Ce prix inclut :**
*   Développement intégral (Mobile, Web, Backend).
*   Design UI/UX professionnel.
*   Tests et Assurance Qualité.
*   Déploiement initial et configuration serveur.
*   Garantie et maintenance corrective post-démarrage (durée à définir au contrat).

---

*Fait pour servir et valoir ce que de droit.*
