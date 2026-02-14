import PDFDocument from 'pdfkit';
import { Response } from 'express';
import path from 'path';
import fs from 'fs';

interface DocumentTemplate {
    logoUrl?: string | null;
    headerTitle?: string;
    headerSubtitle?: string | null;
    headerAddress?: string | null;
    headerPhone?: string | null;
    headerColor?: string;
    footerText?: string | null;
    signatureUrl?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    showRxSymbol?: boolean;
    showDiagnosis?: boolean;
    showPatientId?: boolean;
    showQrCode?: boolean;
}

/**
 * Download image from URL and return as buffer
 */
async function fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
        // Handle local file URLs
        if (url.startsWith('/uploads/')) {
            const filePath = path.join(process.cwd(), url);
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath);
            }
            return null;
        }

        // Handle remote URLs
        const response = await fetch(url);
        if (!response.ok) return null;
        return Buffer.from(await response.arrayBuffer());
    } catch {
        return null;
    }
}

export class PDFService {
    static async generatePrescriptionPDF(prescription: any, res: Response, template?: DocumentTemplate | null) {
        const doc = new PDFDocument({ margin: 50 });

        // Pipe the PDF into the response
        doc.pipe(res);

        // Use template values or defaults
        const primaryColor = template?.primaryColor || '#0A84FF';
        const secondaryColor = template?.secondaryColor || '#444444';
        const headerTitle = template?.headerTitle || 'MEDICO';
        const headerSubtitle = template?.headerSubtitle || 'Premium Healthcare Solutions';
        const showRxSymbol = template?.showRxSymbol !== false;
        const showDiagnosis = template?.showDiagnosis !== false;
        const showPatientId = template?.showPatientId !== false;

        // Header - Logo (if available)
        if (template?.logoUrl) {
            const logoBuffer = await fetchImageBuffer(template.logoUrl);
            if (logoBuffer) {
                try {
                    doc.image(logoBuffer, 450, 30, { width: 80 });
                } catch {
                    // Logo failed, continue without it
                }
            }
        }

        // Header Title
        doc.fillColor(primaryColor).fontSize(25).text(headerTitle, { align: 'right' });
        doc.fillColor(secondaryColor).fontSize(10).text(headerSubtitle, { align: 'right' });

        if (template?.headerAddress) {
            doc.text(template.headerAddress, { align: 'right' });
        }
        if (template?.headerPhone) {
            doc.text(template.headerPhone, { align: 'right' });
        }
        doc.moveDown();

        // Rx Section
        if (showRxSymbol) {
            doc.fillColor(primaryColor).fontSize(40).text('Rx', 50, 50);
        }
        doc.moveDown();

        // Prescription Metadata
        doc.fillColor(secondaryColor).fontSize(10);
        doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, { align: 'right' });
        doc.text(`Prescription ID: ${prescription.id}`, { align: 'right' });
        doc.moveDown();

        // Doctor Info
        doc.fillColor('#000000').fontSize(14).text('PRESCRIBING PHYSICIAN');
        const doctorFirstName = prescription.doctor?.user?.firstName || prescription.doctor?.firstName || 'Unknown';
        const doctorLastName = prescription.doctor?.user?.lastName || prescription.doctor?.lastName || 'Doctor';
        doc.fontSize(12).text(`Dr. ${doctorFirstName} ${doctorLastName}`);
        doc.fontSize(10).fillColor('#666666').text(prescription.doctor?.specialty || 'Medical Specialist');
        doc.moveDown();

        // Patient Info
        doc.fillColor('#000000').fontSize(14).text('PATIENT');
        const patientFirstName = prescription.patient?.user?.firstName || prescription.patient?.firstName || 'Unknown';
        const patientLastName = prescription.patient?.user?.lastName || prescription.patient?.lastName || 'Patient';
        doc.fontSize(12).text(`${patientFirstName} ${patientLastName}`);
        if (showPatientId) {
            doc.fontSize(10).fillColor('#666666').text(`Patient ID: ${prescription.patient?.id || prescription.patientId || 'N/A'}`);
        }
        doc.moveDown();

        // Horizontal Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#EEEEEE').stroke();
        doc.moveDown();

        // Diagnosis
        if (showDiagnosis && prescription.diagnosis) {
            doc.fillColor('#000000').fontSize(12).text('DIAGNOSIS:', { continued: true });
            doc.fillColor(secondaryColor).text(` ${prescription.diagnosis}`);
            doc.moveDown();
        }

        // Medications Table
        doc.fillColor('#000000').fontSize(14).text('MEDICATIONS', { underline: true });
        doc.moveDown(0.5);

        prescription.items.forEach((item: any, index: number) => {
            doc.fillColor('#000000').fontSize(12).text(`${index + 1}. ${item.medication} - ${item.dosage}`);
            doc.fillColor('#666666').fontSize(10).text(`   Sig: ${item.frequency} for ${item.duration}`);
            if (item.instructions) {
                doc.font('Helvetica-Oblique').text(`   Instructions: ${item.instructions}`).font('Helvetica');
            }
            doc.moveDown(0.5);
        });

        // General Instructions
        if (prescription.instructions) {
            doc.moveDown();
            doc.fillColor('#000000').fontSize(12).text('GENERAL INSTRUCTIONS:');
            doc.fillColor(secondaryColor).fontSize(10).text(prescription.instructions);
        }

        // Signature (if available)
        const signatureUrl = prescription.temporarySignature || template?.signatureUrl;
        if (signatureUrl) {
            const signatureBuffer = await fetchImageBuffer(signatureUrl);
            if (signatureBuffer) {
                try {
                    const bottom = doc.page.height - 150;
                    doc.image(signatureBuffer, 400, bottom, { width: 100 });
                } catch {
                    // Signature failed, continue without it
                }
            }
        }

        // Footer
        const bottom = doc.page.height - 100;
        doc.moveTo(50, bottom).lineTo(550, bottom).strokeColor('#EEEEEE').stroke();

        const footerText = template?.footerText ||
            'This is a digitally generated prescription from the Medico platform. Please verify with the prescribing physician if you have any questions.';

        doc.fillColor('#888888').fontSize(8).text(
            footerText,
            50,
            bottom + 10,
            { align: 'center', width: 500 }
        );

        // Finalize the PDF
        doc.end();
    }

    static async generateVisitSummaryPDF(record: any, res: Response) {
        const doc = new PDFDocument({ margin: 50 });

        doc.pipe(res);

        // Header
        doc.fillColor('#0A84FF').fontSize(25).text('MEDICO', { align: 'right' });
        doc.fillColor('#444444').fontSize(10).text('Medical Visit Summary', { align: 'right' });
        doc.moveDown();

        doc.fillColor('#000000').fontSize(20).text('VISIT SUMMARY', { align: 'center' });
        doc.moveDown();

        // Metadata
        doc.fillColor('#444444').fontSize(10);
        doc.text(`Visit Date: ${new Date(record.visitDate).toLocaleDateString()}`, { align: 'right' });
        doc.text(`Record ID: ${record.id}`, { align: 'right' });
        doc.moveDown();

        // Patient & Doctor Grid
        const startY = doc.y;
        const patientFirstName = record.patient?.user?.firstName || record.patient?.firstName || 'Unknown';
        const patientLastName = record.patient?.user?.lastName || record.patient?.lastName || 'Patient';
        doc.fillColor('#000000').fontSize(12).text('PATIENT', 50, startY);
        doc.fontSize(10).text(`${patientFirstName} ${patientLastName}`, 50, startY + 15);

        const doctorFirstName = record.doctor?.user?.firstName || record.doctor?.firstName || 'Unknown';
        const doctorLastName = record.doctor?.user?.lastName || record.doctor?.lastName || 'Doctor';
        doc.fillColor('#000000').fontSize(12).text('HEALTHCARE PROVIDER', 300, startY);
        doc.fontSize(10).text(`Dr. ${doctorFirstName} ${doctorLastName}`, 300, startY + 15);
        doc.fontSize(10).fillColor('#666666').text(record.doctor?.specialty || 'Specialist', 300, startY + 30);

        doc.moveDown(4);

        // Chief Complaint
        if (record.chiefComplaint) {
            doc.fillColor('#000000').fontSize(12).text('CHIEF COMPLAINT:');
            doc.fillColor('#444444').fontSize(11).text(record.chiefComplaint);
            doc.moveDown();
        }

        // Vitals Section
        doc.fillColor('#000000').fontSize(14).text('VITAL SIGNS');
        doc.moveDown(0.5);

        const vitals = [];
        if (record.bloodPressure) vitals.push(`BP: ${record.bloodPressure}`);
        if (record.heartRate) vitals.push(`HR: ${record.heartRate} bpm`);
        if (record.temperature) vitals.push(`Temp: ${record.temperature}°C`);
        if (record.weight) vitals.push(`Weight: ${record.weight} kg`);

        if (vitals.length > 0) {
            doc.fillColor('#444444').fontSize(11).text(vitals.join('  |  '));
        } else {
            doc.fillColor('#888888').fontSize(10).text('No vitals recorded');
        }
        doc.moveDown();

        // Clinical Findings
        doc.fillColor('#000000').fontSize(14).text('CLINICAL FINDINGS');
        doc.moveDown(0.5);

        if (record.diagnosis) {
            doc.fontSize(12).text('Diagnosis:');
            doc.fillColor('#444444').fontSize(11).text(record.diagnosis);
            doc.moveDown(0.5);
        }

        if (record.symptoms) {
            doc.fillColor('#000000').fontSize(12).text('Symptoms:');
            doc.fillColor('#444444').fontSize(11).text(record.symptoms);
            doc.moveDown(0.5);
        }

        if (record.notes) {
            doc.fillColor('#000000').fontSize(12).text('Clinical Notes:');
            doc.fillColor('#444444').fontSize(11).text(record.notes);
            doc.moveDown(0.5);
        }

        // Follow-up
        if (record.followUpDate) {
            doc.moveDown();
            doc.fillColor('#0A84FF').fontSize(12).text('FOLLOW-UP RECOMMENDED:');
            doc.fillColor('#000000').fontSize(11).text(new Date(record.followUpDate).toLocaleDateString());
            if (record.followUpNotes) {
                doc.fillColor('#444444').fontSize(10).text(record.followUpNotes);
            }
        }

        // Footer
        const bottom = doc.page.height - 80;
        doc.fillColor('#888888').fontSize(8).text(
            'This document is a summary of your medical visit at Medico. Keep it for your personal records.',
            50,
            bottom,
            { align: 'center', width: 500 }
        );

        doc.end();
    }

    static async generateLabReportPDF(labRequest: any, res: Response, template?: DocumentTemplate | null) {
        const doc = new PDFDocument({ margin: 50 });

        doc.pipe(res);

        // Use template values or defaults
        const primaryColor = template?.primaryColor || '#007AFF';
        const secondaryColor = template?.secondaryColor || '#444444';
        const headerTitle = template?.headerTitle || labRequest.labCenter?.name || 'LABORATORY REPORT';
        const headerSubtitle = template?.headerSubtitle || 'Diagnostic Services';

        // Header - Logo
        if (template?.logoUrl) {
            const logoBuffer = await fetchImageBuffer(template.logoUrl);
            if (logoBuffer) {
                try {
                    doc.image(logoBuffer, 50, 30, { width: 80 });
                } catch {
                    // Logo failed
                }
            }
        }

        // Header - Lab Info
        doc.fillColor(primaryColor).fontSize(20).text(headerTitle, { align: 'right' });
        doc.fillColor(secondaryColor).fontSize(10).text(headerSubtitle, { align: 'right' });
        if (template?.headerAddress) doc.text(template.headerAddress, { align: 'right' });
        if (template?.headerPhone) doc.text(template.headerPhone, { align: 'right' });
        doc.moveDown(2);

        // Report Title
        doc.fillColor('#000000').fontSize(18).text('LABORATORY TEST REPORT', { align: 'center', underline: true });
        doc.moveDown();

        // Patient & Request Info
        const infoY = doc.y;
        doc.fontSize(12).fillColor('#000000').text('PATIENT INFORMATION', 50, infoY);
        doc.fontSize(10).fillColor('#444444');
        doc.text(`Name: ${labRequest.patient?.firstName} ${labRequest.patient?.lastName}`);
        doc.text(`Patient ID: ${labRequest.patientId}`);

        doc.fontSize(12).fillColor('#000000').text('REPORT INFORMATION', 300, infoY);
        doc.fontSize(10).fillColor('#444444');
        doc.text(`Request ID: ${labRequest.id}`, 300);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 300);
        doc.text(`Collected: ${labRequest.scheduledDate ? new Date(labRequest.scheduledDate).toLocaleDateString() : 'N/A'}`, 300);

        doc.moveDown(2);

        // Results Table Header
        const tableY = doc.y;
        doc.rect(50, tableY, 500, 20).fill(primaryColor);
        doc.fillColor('#FFFFFF').fontSize(11).text('TEST NAME', 60, tableY + 5);
        doc.text('RESULT', 250, tableY + 5);
        doc.text('REFERENCE RANGE', 400, tableY + 5);

        doc.moveDown(0.5);
        let currentY = tableY + 25;

        // items
        labRequest.items.forEach((item: any) => {
            doc.fillColor('#000000').fontSize(10).text(item.test?.name || 'Test', 60, currentY);
            doc.text(item.resultValue || 'PENDING', 250, currentY);
            doc.text(item.test?.referenceRange || 'N/A', 400, currentY);

            currentY += 20;
            // Draw thin line
            doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).strokeColor('#EEEEEE').stroke();
        });

        doc.y = currentY + 20;

        // Lab Technician / Signature
        if (labRequest.technician) {
            doc.fillColor('#000000').fontSize(11).text('Technician:', { continued: true });
            doc.fillColor('#444444').text(` ${labRequest.technician.firstName} ${labRequest.technician.lastName}`);
        }

        if (template?.signatureUrl) {
            const signatureBuffer = await fetchImageBuffer(template.signatureUrl);
            if (signatureBuffer) {
                try {
                    doc.image(signatureBuffer, 400, doc.y, { width: 100 });
                } catch {
                    // Signature failed
                }
            }
        }

        // Footer
        const footerY = doc.page.height - 80;
        doc.moveTo(50, footerY).lineTo(550, footerY).strokeColor('#EEEEEE').stroke();

        const footerText = template?.footerText ||
            'This report is for diagnostic purposes only. Please consult with your physician for interpretation.';

        doc.fillColor('#888888').fontSize(8).text(
            footerText,
            50,
            footerY + 10,
            { align: 'center', width: 500 }
        );

        doc.end();
    }
}
