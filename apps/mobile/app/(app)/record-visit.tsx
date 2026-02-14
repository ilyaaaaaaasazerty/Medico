import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { appointmentApi } from '@/services/appointment.api';
import { SubjectiveSection } from '@/components/consultation/SubjectiveSection';
import { ObjectiveSection } from '@/components/consultation/ObjectiveSection';
import { AssessmentSection } from '@/components/consultation/AssessmentSection';
import { PlanSection } from '@/components/consultation/PlanSection';

import { clinicalOrderApi, ClinicalOrderType } from '@/services/clinical-order.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

export default function RecordVisitScreen() {
    const { appointmentId, patientId, patientName } = useLocalSearchParams<{
        appointmentId: string;
        patientId: string;
        patientName?: string;
    }>();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Form State
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState(''); // Plan notes
    const [objectiveNotes, setObjectiveNotes] = useState(''); // Physical Exam notes
    const [hasPrescription, setHasPrescription] = useState(false);

    // Vitals
    const [bloodPressure, setBloodPressure] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [temperature, setTemperature] = useState('');
    const [weight, setWeight] = useState('');

    const [followUpNotes, setFollowUpNotes] = useState('');
    const [healthProfile, setHealthProfile] = useState<any>(null);
    const [attachments, setAttachments] = useState<any[]>([]);

    // Ordered Items State
    const [orderedItems, setOrderedItems] = useState({
        lab: false,
        imaging: false,
        procedure: false
    });

    const [historyExpanded, setHistoryExpanded] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (patientId) fetchHealthProfile();
            if (appointmentId) {
                fetchAppointmentDetails();
                fetchExistingOrders();
            }
        }, [patientId, appointmentId])
    );

    const fetchExistingOrders = async () => {
        try {
            const res = await clinicalOrderApi.getAppointmentOrders(appointmentId);
            if (res.data) {
                setOrderedItems({
                    lab: res.data.some(o => o.type === ClinicalOrderType.LAB),
                    imaging: res.data.some(o => o.type === ClinicalOrderType.IMAGING),
                    procedure: res.data.some(o => o.type === ClinicalOrderType.PROCEDURE),
                });
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const handleCreateOrder = async (type: ClinicalOrderType, title: string) => {
        Alert.prompt(
            `Issue ${title}`,
            `Specify clinical parameters for the ${title.toLowerCase()} requisition:`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Authorize',
                    onPress: async (description?: string) => {
                        if (!description?.trim()) return;
                        try {
                            const res = await clinicalOrderApi.createOrder({
                                appointmentId,
                                type,
                                description: description.trim(),
                            });
                            if (res.data) {
                                fetchExistingOrders();
                            }
                        } catch (error) {
                            Alert.alert('System Error', 'Failed to authorize order');
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    const fetchHealthProfile = async () => {
        try {
            const res = await doctorApi.getPatientHealthProfile(patientId);
            if (res.success) {
                setHealthProfile(res.data);
            }
        } catch (error) {
            console.error('Error fetching health profile:', error);
        }
    };

    const fetchAppointmentDetails = async () => {
        try {
            const res = await appointmentApi.getAppointmentDetails(appointmentId);
            if (res.success && res.data) {
                setAttachments(res.data.attachments || []);
                setHasPrescription(!!res.data.prescription);

                if (res.data.medicalRecord) {
                    const record = res.data.medicalRecord;
                    setIsEditMode(true);
                    setDiagnosis(record.diagnosis || '');
                    setNotes(record.notes || '');
                    setChiefComplaint(record.chiefComplaint || '');
                    setFollowUpNotes(record.followUpNotes || '');
                    setBloodPressure(record.bloodPressure || '');
                    if (record.heartRate) setHeartRate(record.heartRate.toString());
                    if (record.temperature) setTemperature(record.temperature.toString());
                    if (record.weight) setWeight(record.weight.toString());
                    setSymptoms(record.symptoms || '');
                }
            }
        } catch (error) {
            console.error('Error fetching appointment details:', error);
        }
    };

    const handleSave = async () => {
        if (!diagnosis.trim()) {
            Alert.alert('Protocol Incomplete', 'Primary diagnosis (Assessment) is required for session finalization.');
            return;
        }

        if (!patientId) {
            Alert.alert('Registry Error', 'Missing subject identification.');
            return;
        }

        setSaving(true);
        try {
            const data = {
                patientId,
                visitDate: new Date().toISOString(),
                chiefComplaint: chiefComplaint || undefined,
                symptoms: symptoms + (objectiveNotes ? `\n\n[Physical Exam]: ${objectiveNotes}` : ''),
                diagnosis: diagnosis.trim(),
                notes: notes || undefined,
                bloodPressure: bloodPressure || undefined,
                heartRate: heartRate ? parseInt(heartRate) : undefined,
                temperature: temperature ? parseFloat(temperature) : undefined,
                weight: weight ? parseFloat(weight) : undefined,
                followUpNotes: followUpNotes || undefined,
            };

            let res;
            if (isEditMode) {
                res = await doctorApi.updateRecord(appointmentId, data);
            } else {
                res = await doctorApi.createRecord(appointmentId, data);
            }

            if (res.success) {
                router.push({
                    pathname: '/(app)/consultation-review',
                    params: { appointmentId, patientId }
                });
            } else {
                Alert.alert('Record Error', res.error || 'Failed to commit session data');
            }
        } catch (error) {
            Alert.alert('System Error', 'Protocol commitment failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="close" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Session Documentation</AppText>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <AppText variant="caption" color="white" weight="black" uppercase>Finalize</AppText>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.sessionBanner}>
                    <View style={styles.badge}>
                        <Ionicons name="medical" size={16} color={Theme.Colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 9 }}>Active Protocol</AppText>
                        <AppText variant="body" weight="black">{patientName || 'Anonymous Subject'}</AppText>
                    </View>
                </View>

                {/* S: Subjective */}
                <SubjectiveSection
                    patientName={patientName}
                    healthProfile={healthProfile}
                    chiefComplaint={chiefComplaint}
                    setChiefComplaint={setChiefComplaint}
                    symptoms={symptoms}
                    setSymptoms={setSymptoms}
                    historyExpanded={historyExpanded}
                    setHistoryExpanded={setHistoryExpanded}
                />

                <View style={styles.sectionDivider} />

                {/* O: Objective */}
                <ObjectiveSection
                    bloodPressure={bloodPressure}
                    setBloodPressure={setBloodPressure}
                    heartRate={heartRate}
                    setHeartRate={setHeartRate}
                    temperature={temperature}
                    setTemperature={setTemperature}
                    weight={weight}
                    setWeight={setWeight}
                    notes={objectiveNotes}
                    setNotes={setObjectiveNotes}
                    attachments={attachments}
                />

                <View style={styles.sectionDivider} />

                {/* A: Assessment */}
                <AssessmentSection
                    diagnosis={diagnosis}
                    setDiagnosis={setDiagnosis}
                />

                <View style={styles.sectionDivider} />

                {/* P: Plan */}
                <PlanSection
                    notes={notes}
                    setNotes={setNotes}
                    followUpNotes={followUpNotes}
                    setFollowUpNotes={setFollowUpNotes}
                    orderedItems={orderedItems}
                    hasPrescription={hasPrescription}
                    onPrescribe={() => {
                        router.push({
                            pathname: '/(app)/prescription-builder',
                            params: { appointmentId, patientId }
                        });
                    }}
                    onOrderLab={() => router.push({ pathname: '/(app)/order-lab', params: { appointmentId, type: ClinicalOrderType.LAB } })}
                    onOrderImaging={() => router.push({ pathname: '/(app)/order-lab', params: { appointmentId, type: ClinicalOrderType.IMAGING } })}
                    onOrderProcedure={() => handleCreateOrder(ClinicalOrderType.PROCEDURE, 'Clinical Procedure')}
                />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    saveBtn: { height: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.md },

    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 40 },

    sessionBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 24, padding: 16, backgroundColor: Theme.Colors.surface, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: Theme.Colors.primary },
    badge: { width: 36, height: 36, borderRadius: 10, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    sectionDivider: { height: 8, backgroundColor: Theme.Colors.background, marginVertical: 8 },
});
