import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

type TabType = 'records' | 'prescriptions' | 'documents';

interface MedicalRecord {
    id: string;
    visitDate: string;
    diagnosis?: string;
    chiefComplaint?: string;
    prescription?: { id: string };
}

interface Prescription {
    id: string;
    createdAt: string;
    diagnosis?: string;
    doctor?: {
        firstName?: string;
        lastName?: string;
    };
    items: Array<{ medication: string }>;
}

interface Document {
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
}

export default function MyRecordsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('records');
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'records') {
                const res = await patientApi.getRecords();
                if (res.success && res.data) setRecords(res.data);
            } else if (activeTab === 'prescriptions') {
                const res = await patientApi.getPrescriptions();
                if (res.success && res.data) setPrescriptions(res.data);
            } else if (activeTab === 'documents') {
                const res = await patientApi.getDocuments();
                if (res.success && res.data) setDocuments(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderRecordItem = (item: MedicalRecord) => (
        <AppCard
            key={item.id}
            style={styles.ledgerCard}
            padding="md"
            onPress={() => router.push({ pathname: '/(app)/record-detail', params: { id: item.id } })}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: Theme.Colors.primary + '10' }]}>
                    <Ionicons name="document-text" size={22} color={Theme.Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 10 }}>CONSULTATION RECORD</AppText>
                    <AppText variant="body" weight="black" numberOfLines={1}>{item.diagnosis || 'Clinical Visit'}</AppText>
                </View>
                <View style={styles.dateBadge}>
                    <AppText variant="caption" color="textSecondary" weight="black">{formatDate(item.visitDate)}</AppText>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View style={{ flex: 1 }}>
                    <AppText variant="caption" color="textSecondary" weight="bold">CHIEF COMPLAINT</AppText>
                    <AppText variant="caption" weight="black" numberOfLines={1}>{item.chiefComplaint || 'Routine Checkup'}</AppText>
                </View>
                {item.prescription && (
                    <View style={styles.rxTag}>
                        <Ionicons name="flask" size={12} color={Theme.Colors.primary} />
                        <AppText variant="caption" weight="black" color="primary" style={{ fontSize: 10 }}>Rx INCLUDED</AppText>
                    </View>
                )}
            </View>
        </AppCard>
    );

    const renderPrescriptionItem = (item: Prescription) => (
        <AppCard
            key={item.id}
            style={styles.ledgerCard}
            padding="md"
            onPress={() => router.push({ pathname: '/(app)/prescription-detail', params: { id: item.id } })}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: Theme.Colors.success + '10' }]}>
                    <Ionicons name="medical" size={22} color={Theme.Colors.success} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <AppText variant="caption" color="success" weight="black" uppercase style={{ fontSize: 10 }}>AUTHORIZED REGIMEN</AppText>
                    <AppText variant="body" weight="black" numberOfLines={1}>
                        {item.doctor ? `Dr. ${item.doctor.firstName} ${item.doctor.lastName}` : 'Diagnostic Script'}
                    </AppText>
                </View>
                <View style={styles.dateBadge}>
                    <AppText variant="caption" color="textSecondary" weight="black">{formatDate(item.createdAt)}</AppText>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View style={{ flex: 1 }}>
                    <AppText variant="caption" color="textSecondary" weight="bold">MEDICATIONS ({item.items.length})</AppText>
                    <AppText variant="caption" weight="black" numberOfLines={1}>
                        {item.items.map(m => m.medication).join(', ')}
                    </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Theme.Colors.divider} />
            </View>
        </AppCard>
    );

    const renderDocumentItem = (item: Document) => (
        <AppCard
            key={item.id}
            style={styles.ledgerCard}
            padding="md"
            onPress={() => router.push({ pathname: '/(app)/document-viewer', params: { id: item.id } })}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: Theme.Colors.warning + '10' }]}>
                    <Ionicons name="folder" size={22} color={Theme.Colors.warning} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <AppText variant="caption" color="warning" weight="black" uppercase style={{ fontSize: 10 }}>{item.type.replace('_', ' ')}</AppText>
                    <AppText variant="body" weight="black" numberOfLines={1}>{item.name}</AppText>
                </View>
                <View style={styles.dateBadge}>
                    <AppText variant="caption" color="textSecondary" weight="black">{formatDate(item.uploadedAt)}</AppText>
                </View>
            </View>
        </AppCard>
    );

    const tabs: { key: TabType; label: string; icon: any }[] = [
        { key: 'records', label: 'Ledger', icon: 'document-text' },
        { key: 'prescriptions', label: 'Scripts', icon: 'medical' },
        { key: 'documents', label: 'Vault', icon: 'folder' },
    ];

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Medical Records</AppText>
                <TouchableOpacity
                    style={[styles.circleBtn, { backgroundColor: Theme.Colors.primary }]}
                    onPress={() => router.push('/(app)/upload-document')}
                >
                    <Ionicons name="cloud-upload" size={20} color={Theme.Colors.white} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabWrapper}>
                <View style={styles.tabContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                            onPress={() => setActiveTab(tab.key)}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={18}
                                color={activeTab === tab.key ? Theme.Colors.white : Theme.Colors.textSecondary}
                            />
                            <AppText
                                variant="caption"
                                weight="black"
                                style={[styles.tabText, { color: activeTab === tab.key ? Theme.Colors.white : Theme.Colors.textSecondary }]}
                            >
                                {tab.label}
                            </AppText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={Theme.Colors.primary} />
                    </View>
                ) : (
                    <>
                        {activeTab === 'records' && records.map(renderRecordItem)}
                        {activeTab === 'prescriptions' && prescriptions.map(renderPrescriptionItem)}
                        {activeTab === 'documents' && documents.map(renderDocumentItem)}

                        {!loading && ((activeTab === 'records' && records.length === 0) ||
                            (activeTab === 'prescriptions' && prescriptions.length === 0) ||
                            (activeTab === 'documents' && documents.length === 0)) && (
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconBox}>
                                        <Ionicons name="archive-outline" size={64} color={Theme.Colors.divider} />
                                    </View>
                                    <AppText variant="h3" weight="black" style={{ marginTop: 24 }}>Vault is Empty</AppText>
                                    <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 12, paddingHorizontal: 40 }}>
                                        No official {activeTab} have been archived in your medical history yet.
                                    </AppText>
                                </View>
                            )}
                    </>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    tabWrapper: { paddingHorizontal: 24, marginBottom: 24 },
    tabContainer: { flexDirection: 'row', backgroundColor: Theme.Colors.surface, borderRadius: 20, padding: 6, gap: 4 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, gap: 8 },
    tabActive: { backgroundColor: Theme.Colors.primary, ...Theme.Shadows.soft },
    tabText: { textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 },

    scrollContent: { paddingHorizontal: 24 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },

    ledgerCard: { marginBottom: 16, borderLeftWidth: 4, borderLeftColor: Theme.Colors.primary },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    dateBadge: { backgroundColor: Theme.Colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Theme.Colors.divider },

    divider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 16 },

    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rxTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Theme.Colors.primary + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },

    emptyState: { alignItems: 'center', paddingTop: 80 },
    emptyIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },
});
