import { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Image, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import Signature from 'react-native-signature-canvas';
import * as FileSystem from 'expo-file-system/legacy';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

interface MedicationItem {
    id: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
}

const FREQUENCY_OPTIONS = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'Four times daily',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'Before meals',
    'After meals',
    'At bedtime',
];

const DURATION_OPTIONS = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '21 days',
    '30 days',
    '60 days',
    '90 days',
    'Continuous',
];

export default function PrescriptionBuilderScreen() {
    const { appointmentId, patientId } = useLocalSearchParams<{
        appointmentId: string;
        patientId: string;
    }>();
    const { user } = useAuth();
    const signatureRef = useRef<any>(null);

    const [saving, setSaving] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [instructions, setInstructions] = useState('');
    const [medications, setMedications] = useState<MedicationItem[]>([]);
    const [temporarySignature, setTemporarySignature] = useState<string | null>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingMed, setEditingMed] = useState<MedicationItem | null>(null);
    const [medName, setMedName] = useState('');
    const [medDosage, setMedDosage] = useState('');
    const [medFrequency, setMedFrequency] = useState(FREQUENCY_OPTIONS[0]);
    const [medDuration, setMedDuration] = useState(DURATION_OPTIONS[2]);
    const [medInstructions, setMedInstructions] = useState('');
    const [medQuantity, setMedQuantity] = useState('');

    const resetMedForm = () => {
        setMedName('');
        setMedDosage('');
        setMedFrequency(FREQUENCY_OPTIONS[0]);
        setMedDuration(DURATION_OPTIONS[2]);
        setMedInstructions('');
        setMedQuantity('');
        setEditingMed(null);
    };

    const handleAddMedication = () => {
        if (!medName.trim() || !medDosage.trim()) {
            Alert.alert('Incomplete Data', 'Please enter medication name and dosage');
            return;
        }

        const newMed: MedicationItem = {
            id: editingMed?.id || Date.now().toString(),
            medication: medName.trim(),
            dosage: medDosage.trim(),
            frequency: medFrequency,
            duration: medDuration,
            instructions: medInstructions || undefined,
            quantity: medQuantity ? parseInt(medQuantity) : undefined,
        };

        if (editingMed) {
            setMedications(medications.map(m => m.id === editingMed.id ? newMed : m));
        } else {
            setMedications([...medications, newMed]);
        }

        setShowAddModal(false);
        resetMedForm();
    };

    const handleEditMedication = (med: MedicationItem) => {
        setEditingMed(med);
        setMedName(med.medication);
        setMedDosage(med.dosage);
        setMedFrequency(med.frequency);
        setMedDuration(med.duration);
        setMedInstructions(med.instructions || '');
        setMedQuantity(med.quantity?.toString() || '');
        setShowAddModal(true);
    };

    const handleRemoveMedication = (id: string) => {
        setMedications(medications.filter(m => m.id !== id));
    };

    const handleSignature = async (signature: string) => {
        try {
            setSaving(true);
            const base64Data = signature.replace('data:image/png;base64,', '');
            const fileUri = FileSystem.cacheDirectory + `temp-sig-${Date.now()}.png`;
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                encoding: 'base64'
            });

            const res = await doctorApi.uploadPrescriptionSignature(fileUri);

            if (res.success && res.data) {
                setTemporarySignature(res.data.signatureUrl);
                setShowSignatureModal(false);
            } else {
                Alert.alert('Upload Failed', res.error || 'Failed to upload signature.');
            }
        } catch (error) {
            console.error('Error saving signature:', error);
            Alert.alert('Error', 'Failed to save signature');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        if (medications.length === 0) {
            Alert.alert('Empty Rx', 'Please add at least one medication');
            return;
        }

        if (!temporarySignature) {
            Alert.alert(
                'Signature Missing',
                'Please sign the prescription to validate the medical record.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Now', onPress: () => setShowSignatureModal(true) }
                ]
            );
            return;
        }

        setSaving(true);
        try {
            const res = await doctorApi.createPrescription(appointmentId, {
                patientId,
                diagnosis: diagnosis || undefined,
                instructions: instructions || undefined,
                temporarySignature: temporarySignature || undefined,
                items: medications.map(({ id, ...rest }) => rest),
            });

            if (res.success) {
                Alert.alert('Regimen Active', 'The prescription has been dispatched to the patient.', [
                    { text: 'Done', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Dispatch Failed', res.error || 'Failed to create prescription');
            }
        } catch (error) {
            console.error('Error creating prescription:', error);
            Alert.alert('Clinical Error', 'Failed to store prescription record');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppScreen padding={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Pharmacological Requisition</AppText>
                <TouchableOpacity
                    style={[styles.commitBtn, saving && styles.commitBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <AppText variant="caption" color="textInverted" weight="black" uppercase>Commit</AppText>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Template Import */}
                <TouchableOpacity style={styles.templateBtn} onPress={() => router.push('/(app)/prescription-templates')}>
                    <LinearGradient
                        colors={[Theme.Colors.primary + '15', Theme.Colors.primary + '05']}
                        style={styles.templateGradient}
                    >
                        <View style={styles.templateIconBox}>
                            <Ionicons name="copy" size={20} color={Theme.Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText variant="body" weight="black">Protocol Library</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold">Import clinical template</AppText>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Theme.Colors.primary} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Diagnosis Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Clinical Indication</AppText>
                    <AppInput
                        placeholder="Enter primary diagnosis..."
                        value={diagnosis}
                        onChangeText={setDiagnosis}
                        multiline
                        style={{ minHeight: 80, paddingTop: 16 }}
                    />
                </View>

                {/* Regimen Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Authorized Regimen</AppText>
                        <TouchableOpacity style={styles.addMedBtn} onPress={() => setShowAddModal(true)}>
                            <Ionicons name="add" size={18} color="white" />
                            <AppText variant="caption" color="textInverted" weight="black" uppercase style={{ marginLeft: 4 }}>Add Medication</AppText>
                        </TouchableOpacity>
                    </View>

                    {medications.length === 0 ? (
                        <AppCard padding="xl" style={styles.emptyCard}>
                            <Ionicons name="medical-outline" size={40} color={Theme.Colors.divider} />
                            <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 12 }}>No medications documented</AppText>
                        </AppCard>
                    ) : (
                        medications.map((med) => (
                            <AppCard key={med.id} style={styles.medCard} padding="md">
                                <View style={styles.medMain}>
                                    <View style={styles.medIconBox}>
                                        <Ionicons name="bandage-outline" size={20} color={Theme.Colors.primary} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <AppText variant="body" weight="black">{med.medication}</AppText>
                                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 10 }}>{med.dosage}</AppText>
                                    </View>
                                    <View style={styles.medActions}>
                                        <TouchableOpacity onPress={() => handleEditMedication(med)} style={styles.actionIcon}>
                                            <Ionicons name="pencil-outline" size={18} color={Theme.Colors.textSecondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleRemoveMedication(med.id)} style={styles.actionIcon}>
                                            <Ionicons name="trash-outline" size={18} color={Theme.Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.medFooter}>
                                    <View style={styles.footerTag}>
                                        <Ionicons name="repeat" size={12} color={Theme.Colors.textSecondary} />
                                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 4 }}>{med.frequency}</AppText>
                                    </View>
                                    <View style={styles.footerTag}>
                                        <Ionicons name="timer-outline" size={12} color={Theme.Colors.textSecondary} />
                                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 4 }}>{med.duration}</AppText>
                                    </View>
                                </View>
                                {med.instructions && (
                                    <View style={styles.medNote}>
                                        <AppText variant="caption" color="textSecondary" italic>{med.instructions}</AppText>
                                    </View>
                                )}
                            </AppCard>
                        ))
                    )}
                </View>

                {/* Instructions Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Practitioner Instructions</AppText>
                    <AppInput
                        placeholder="Patient care instructions..."
                        value={instructions}
                        onChangeText={setInstructions}
                        multiline
                        style={{ minHeight: 100, paddingTop: 16 }}
                    />
                </View>

                {/* Authorization Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionLabel}>Clinical Authorization</AppText>
                    {temporarySignature ? (
                        <AppCard padding="md" style={styles.sigPreviewCard}>
                            <Image source={{ uri: temporarySignature }} style={styles.sigImage} resizeMode="contain" />
                            <TouchableOpacity style={styles.redoBtn} onPress={() => setTemporarySignature(null)}>
                                <Ionicons name="refresh" size={16} color="white" />
                                <AppText variant="caption" color="textInverted" weight="black" uppercase style={{ marginLeft: 4 }}>Redo</AppText>
                            </TouchableOpacity>
                        </AppCard>
                    ) : (
                        <TouchableOpacity style={styles.sigGate} onPress={() => setShowSignatureModal(true)}>
                            <Ionicons name="create-outline" size={24} color={Theme.Colors.primary} />
                            <AppText variant="body" color="primary" weight="black" style={{ marginTop: 8 }}>Authorize with Digital Signature</AppText>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Preview Action */}
                {medications.length > 0 && (
                    <AppButton
                        title="Draft Preview"
                        onPress={() => router.push({
                            pathname: '/(app)/prescription-preview',
                            params: {
                                data: JSON.stringify({
                                    diagnosis,
                                    instructions,
                                    temporarySignature,
                                    items: medications,
                                    doctor: {
                                        user: {
                                            firstName: user?.doctor?.firstName || 'Unknown',
                                            lastName: user?.doctor?.lastName || 'Doctor'
                                        }
                                    }
                                })
                            }
                        })}
                        variant="tonal"
                        style={styles.previewBtn}
                    >
                        <Ionicons name="eye-outline" size={20} color={Theme.Colors.primary} style={{ marginRight: 8 }} />
                    </AppButton>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Medication Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h3" weight="black">{editingMed ? 'Refine Line Item' : 'Add Medication'}</AppText>
                            <TouchableOpacity onPress={() => { setShowAddModal(false); resetMedForm(); }} style={styles.circleBtnSmall}>
                                <Ionicons name="close" size={20} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.modalField}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.modalLabel}>Medication Name</AppText>
                                <AppInput placeholder="e.g. Augmentin 1g" value={medName} onChangeText={setMedName} />
                            </View>

                            <View style={styles.modalField}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.modalLabel}>Dosage Unit</AppText>
                                <AppInput placeholder="e.g. 1 Tablet" value={medDosage} onChangeText={setMedDosage} />
                            </View>

                            <View style={styles.modalField}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.modalLabel}>Frequency Protocol</AppText>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                    {FREQUENCY_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.chip, medFrequency === opt && styles.chipActive]}
                                            onPress={() => setMedFrequency(opt)}
                                        >
                                            <AppText variant="caption" color={medFrequency === opt ? 'textInverted' : 'textSecondary'} weight="black">{opt}</AppText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.modalField}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.modalLabel}>Duration Cycle</AppText>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                    {DURATION_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.chip, medDuration === opt && styles.chipActive]}
                                            onPress={() => setMedDuration(opt)}
                                        >
                                            <AppText variant="caption" color={medDuration === opt ? 'textInverted' : 'textSecondary'} weight="black">{opt}</AppText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.modalField}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.modalLabel}>Line Instructions</AppText>
                                <AppInput placeholder="e.g. Take after breakfast" value={medInstructions} onChangeText={setMedInstructions} multiline style={{ minHeight: 80, paddingTop: 12 }} />
                            </View>
                        </ScrollView>

                        <AppButton
                            title={editingMed ? "Update Line" : "Commit to Regimen"}
                            onPress={handleAddMedication}
                            style={styles.modalCommitBtn}
                        />
                    </View>
                </View>
            </Modal>

            {/* Signature Modal */}
            <Modal visible={showSignatureModal} animationType="slide">
                <AppScreen padding={false}>
                    <View style={styles.sigHeader}>
                        <TouchableOpacity onPress={() => setShowSignatureModal(false)} style={styles.circleBtn}>
                            <Ionicons name="close" size={24} color={Theme.Colors.textSecondary} />
                        </TouchableOpacity>
                        <AppText variant="h3" weight="black">Authorizing Requisition</AppText>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.sigPadWrapper}>
                        <Signature
                            ref={signatureRef}
                            onOK={handleSignature}
                            onEmpty={() => Alert.alert('Authorization Error', 'Signature is required for clinical validation.')}
                            descriptionText="Sign clearly to authorize pharmacological dispatch"
                            clearText="Clear Buffer"
                            confirmText="Authorize"
                            webStyle={`
                                .m-signature-pad--footer { display: none; }
                                body,html { width: 100%; height: 100%; background-color: #f8fafc; }
                                .m-signature-pad--body { border: 2px dashed ${Theme.Colors.divider}; border-radius: 24px; margin: 20px; box-shadow: none; }
                            `}
                        />
                    </View>

                    <View style={styles.sigActions}>
                        <AppButton title="Clear Buffer" variant="tonal" onPress={() => signatureRef.current?.clearSignature()} style={{ flex: 1 }} />
                        <View style={{ width: 16 }} />
                        <AppButton title="Validate Script" onPress={() => signatureRef.current?.readSignature()} style={{ flex: 2 }} />
                    </View>
                </AppScreen>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    circleBtnSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    commitBtn: { backgroundColor: Theme.Colors.primary, paddingHorizontal: 16, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    commitBtnDisabled: { opacity: 0.5 },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 24 },

    templateBtn: { marginBottom: 32 },
    templateGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.primary + '20' },
    templateIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 16 },

    section: { marginBottom: 32 },
    sectionLabel: { marginBottom: 12, marginLeft: 4 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },

    addMedBtn: { backgroundColor: Theme.Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 32, borderRadius: 10 },
    emptyCard: { alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.Colors.divider },

    medCard: { marginBottom: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    medMain: { flexDirection: 'row', alignItems: 'center' },
    medIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center' },
    medActions: { flexDirection: 'row', gap: 8 },
    actionIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center' },
    medFooter: { flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    footerTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.background, paddingHorizontal: 8, height: 24, borderRadius: 6 },
    medNote: { marginTop: 8, padding: 8, backgroundColor: Theme.Colors.background, borderRadius: 8 },

    sigGate: { height: 120, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.Colors.primary + '30', justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.primary + '05' },
    sigPreviewCard: { position: 'relative', overflow: 'hidden', height: 120, justifyContent: 'center' },
    sigImage: { width: '100%', height: 80 },
    redoBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: Theme.Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, height: 28, borderRadius: 8 },

    previewBtn: { marginTop: 8, height: 56, borderRadius: 20 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    modalScroll: { padding: 24 },
    modalField: { marginBottom: 24 },
    modalLabel: { marginBottom: 8 },
    chipRow: { gap: 8, paddingRight: 24 },
    chip: { paddingHorizontal: 16, height: 36, borderRadius: 12, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    chipActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },
    modalCommitBtn: { marginHorizontal: 24, height: 56, borderRadius: 20 },

    sigHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: Theme.Colors.surface, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    sigPadWrapper: { flex: 1, backgroundColor: '#f8fafc' },
    sigActions: { flexDirection: 'row', padding: 24, borderTopWidth: 1, borderTopColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface },
});
