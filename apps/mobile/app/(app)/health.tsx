import React, { useEffect, useState } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { patientApi } from '@/services/patient.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

type Tab = 'allergies' | 'conditions' | 'medications' | 'vaccinations' | 'vitals';

const VITAL_TYPES = [
    { key: 'BLOOD_PRESSURE_SYSTOLIC', label: 'BP (Sys)', unit: 'mmHg', icon: '❤️' },
    { key: 'BLOOD_PRESSURE_DIASTOLIC', label: 'BP (Dia)', unit: 'mmHg', icon: '❤️' },
    { key: 'HEART_RATE', label: 'Heart Rate', unit: 'bpm', icon: '💓' },
    { key: 'TEMPERATURE', label: 'Temp', unit: '°C', icon: '🌡️' },
    { key: 'WEIGHT', label: 'Weight', unit: 'kg', icon: '⚖️' },
    { key: 'HEIGHT', label: 'Height', unit: 'cm', icon: '📏' },
    { key: 'BLOOD_GLUCOSE', label: 'Glucose', unit: 'mg/dL', icon: '🩸' },
    { key: 'OXYGEN_SATURATION', label: 'Oxygen', unit: '%', icon: '💨' },
];

const SEVERITY_COLORS: Record<string, string> = {
    SEVERE: Theme.Colors.error,
    MODERATE: Theme.Colors.warning,
    MILD: Theme.Colors.success,
};

export default function HealthScreen() {
    const [activeTab, setActiveTab] = useState<Tab>('allergies');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            let result;
            switch (activeTab) {
                case 'allergies': result = await patientApi.getAllergies(); break;
                case 'conditions': result = await patientApi.getConditions(); break;
                case 'medications': result = await patientApi.getMedications(); break;
                case 'vaccinations': result = await patientApi.getVaccinations(); break;
                case 'vitals': result = await patientApi.getVitals(); break;
            }
            if (result?.success) {
                setData(result.data || []);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            let result;
            switch (activeTab) {
                case 'allergies':
                    result = await patientApi.addAllergy({
                        allergen: formData.name,
                        severity: (formData.severity || 'MODERATE') as any,
                        reaction: formData.reaction,
                    });
                    break;
                case 'conditions':
                    result = await patientApi.addCondition({
                        name: formData.name,
                        notes: formData.notes,
                    });
                    break;
                case 'medications':
                    result = await patientApi.addMedication({
                        name: formData.name,
                        dosage: formData.dosage,
                        frequency: formData.frequency,
                        startDate: new Date().toISOString(),
                        status: 'ACTIVE',
                        prescribedBy: 'Self',
                    });
                    break;
                case 'vaccinations':
                    result = await patientApi.addVaccination({
                        name: formData.name,
                        dateGiven: new Date().toISOString(),
                        provider: formData.provider,
                    });
                    break;
                case 'vitals':
                    if (!formData.value) { Alert.alert('Error', 'Value required'); return; }
                    result = await patientApi.addVital({
                        type: formData.type || 'WEIGHT',
                        value: parseFloat(formData.value),
                        unit: VITAL_TYPES.find(v => v.key === (formData.type || 'WEIGHT'))?.unit || '',
                        recordedAt: new Date().toISOString(),
                        notes: formData.notes
                    });
                    break;
            }

            if (result?.success) {
                setModalVisible(false);
                setFormData({});
                loadData();
            } else {
                Alert.alert('Error', result?.error || 'Failed to add entry');
            }
        } catch (error: any) {
            Alert.alert('Error', 'An unexpected error occurred during submission');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (id: string) => {
        Alert.alert('Clinical Confirmation', 'Are you sure you want to remove this health entry from your official record?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove Entry',
                style: 'destructive',
                onPress: async () => {
                    try {
                        switch (activeTab) {
                            case 'allergies': await patientApi.deleteAllergy(id); break;
                            case 'conditions': await patientApi.removeCondition(id); break;
                            case 'medications': await patientApi.deleteMedication(id); break;
                            case 'vaccinations': await patientApi.removeVaccination(id); break;
                            case 'vitals': await patientApi.deleteVital(id); break;
                        }
                        loadData();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to remove clinical entry');
                    }
                },
            },
        ]);
    };

    const tabs: { key: Tab; label: string; icon: any }[] = [
        { key: 'allergies', label: 'Allergies', icon: 'warning' },
        { key: 'conditions', label: 'Conditions', icon: 'medical' },
        { key: 'medications', label: 'Regimen', icon: 'flask' },
        { key: 'vaccinations', label: 'Vaccines', icon: 'shield-checkmark' },
        { key: 'vitals', label: 'Vitals', icon: 'pulse' },
    ];

    const renderItem = (item: any) => {
        switch (activeTab) {
            case 'allergies':
                return (
                    <AppCard key={item.id} style={styles.recordCard} padding="md">
                        <View style={styles.cardHeader}>
                            <View style={styles.iconBox}>
                                <Ionicons name="warning" size={20} color={Theme.Colors.error} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <AppText variant="body" weight="black">{item.allergen}</AppText>
                                <View style={[styles.badge, { backgroundColor: `${SEVERITY_COLORS[item.severity]}15` }]}>
                                    <View style={[styles.dot, { backgroundColor: SEVERITY_COLORS[item.severity] }]} />
                                    <AppText variant="caption" weight="black" style={{ color: SEVERITY_COLORS[item.severity], fontSize: 10 }}>{item.severity}</AppText>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.smallCircleBtn}>
                                <Ionicons name="trash-outline" size={16} color={Theme.Colors.error} />
                            </TouchableOpacity>
                        </View>
                        {item.reaction && (
                            <View style={styles.reactionBox}>
                                <AppText variant="caption" color="textSecondary" weight="bold">REACTION: {item.reaction}</AppText>
                            </View>
                        )}
                    </AppCard>
                );
            case 'conditions':
                return (
                    <AppCard key={item.id} style={styles.recordCard} padding="md">
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: Theme.Colors.primary + '10' }]}>
                                <Ionicons name="medical" size={20} color={Theme.Colors.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <AppText variant="body" weight="black">{item.name}</AppText>
                                {item.notes && <AppText variant="caption" color="textSecondary" weight="bold" numberOfLines={1}>{item.notes}</AppText>}
                            </View>
                            <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.smallCircleBtn}>
                                <Ionicons name="trash-outline" size={16} color={Theme.Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                );
            case 'medications':
                return (
                    <AppCard key={item.id} style={styles.recordCard} padding="md">
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: '#8B5CF610' }]}>
                                <Ionicons name="flask" size={20} color="#8B5CF6" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <AppText variant="body" weight="black">{item.name}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">{item.dosage} • {item.frequency}</AppText>
                            </View>
                            <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.smallCircleBtn}>
                                <Ionicons name="trash-outline" size={16} color={Theme.Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                );
            case 'vaccinations':
                return (
                    <AppCard key={item.id} style={styles.recordCard} padding="md">
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: Theme.Colors.success + '10' }]}>
                                <Ionicons name="shield-checkmark" size={20} color={Theme.Colors.success} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <AppText variant="body" weight="black">{item.name}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">
                                    {new Date(item.dateGiven).toLocaleDateString()}
                                    {item.provider && ` • ${item.provider}`}
                                </AppText>
                            </View>
                            <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.smallCircleBtn}>
                                <Ionicons name="trash-outline" size={16} color={Theme.Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                );
            case 'vitals':
                const info = VITAL_TYPES.find(v => v.key === item.type) || { label: item.type, unit: item.unit, icon: '📊' };
                return (
                    <AppCard key={item.id} style={styles.recordCard} padding="md">
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: Theme.Colors.primary + '10' }]}>
                                <AppText style={{ fontSize: 16 }}>{info.icon}</AppText>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 10 }}>{info.label}</AppText>
                                <AppText variant="h3" weight="black" color="primary">
                                    {item.value} <AppText variant="caption" color="textSecondary" weight="black">{item.unit}</AppText>
                                </AppText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <AppText variant="caption" color="textSecondary" weight="bold">{new Date(item.recordedAt).toLocaleDateString()}</AppText>
                                <TouchableOpacity onPress={() => handleRemove(item.id)} style={[styles.smallCircleBtn, { marginTop: 4 }]}>
                                    <Ionicons name="trash-outline" size={14} color={Theme.Colors.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </AppCard>
                );
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Clinical Profile</AppText>
                <TouchableOpacity
                    style={[styles.circleBtn, { backgroundColor: Theme.Colors.primary }]}
                    onPress={() => { setFormData({}); setModalVisible(true); }}
                >
                    <Ionicons name="add" size={24} color={Theme.Colors.white} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.historyLink}
                onPress={() => router.push('/(app)/my-records')}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBox, { backgroundColor: Theme.Colors.primary + '15' }]}>
                    <Ionicons name="document-text" size={24} color={Theme.Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <AppText variant="body" weight="black">Clinical Ledger</AppText>
                    <AppText variant="caption" color="textSecondary" weight="bold">View diagnostic records & prescriptions</AppText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Theme.Colors.divider} />
            </TouchableOpacity>

            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
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
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={Theme.Colors.primary} />
                    </View>
                ) : data.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="fitness-outline" size={64} color={Theme.Colors.divider} />
                        </View>
                        <AppText variant="h3" weight="black" style={{ marginTop: 24 }}>Official Record Empty</AppText>
                        <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 12, paddingHorizontal: 40 }}>
                            You have no {activeTab} tracked in your clinical profile yet.
                        </AppText>
                        <AppButton
                            title={`Add ${activeTab.slice(0, -1)}`}
                            onPress={() => setModalVisible(true)}
                            style={{ marginTop: 32, width: '60%', height: 56, borderRadius: 16 }}
                        />
                    </View>
                ) : (
                    data.map(renderItem)
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <AppText variant="h3" weight="black">New Health Entry</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">Updating {activeTab} logs</AppText>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.smallCircleBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
                            {activeTab === 'allergies' && (
                                <>
                                    <AppInput
                                        label="Allergen Name"
                                        placeholder="e.g. Penicillin, Peanuts"
                                        value={formData.name}
                                        onChangeText={(v) => setFormData({ ...formData, name: v })}
                                    />
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ marginVertical: 12 }}>Severity Protocol</AppText>
                                    <View style={styles.severityPicker}>
                                        {['MILD', 'MODERATE', 'SEVERE'].map((s) => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[styles.severityOption, formData.severity === s && { backgroundColor: SEVERITY_COLORS[s], borderColor: SEVERITY_COLORS[s] }]}
                                                onPress={() => setFormData({ ...formData, severity: s })}
                                            >
                                                <AppText variant="caption" weight="black" style={{ color: formData.severity === s ? 'white' : Theme.Colors.textSecondary }}>{s}</AppText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <AppInput
                                        label="Clinical Reaction"
                                        placeholder="Describe symptoms..."
                                        value={formData.reaction}
                                        onChangeText={(v) => setFormData({ ...formData, reaction: v })}
                                    />
                                </>
                            )}

                            {activeTab === 'conditions' && (
                                <>
                                    <AppInput
                                        label="Medical Condition"
                                        placeholder="e.g. Type II Diabetes"
                                        value={formData.name}
                                        onChangeText={(v) => setFormData({ ...formData, name: v })}
                                    />
                                    <AppInput
                                        label="Diagnosis Details"
                                        placeholder="Add specialized notes..."
                                        value={formData.notes}
                                        onChangeText={(v) => setFormData({ ...formData, notes: v })}
                                        multiline
                                        style={{ height: 100 }}
                                    />
                                </>
                            )}

                            {activeTab === 'medications' && (
                                <>
                                    <AppInput
                                        label="Pharmaceutical Name"
                                        placeholder="e.g. Metformin"
                                        value={formData.name}
                                        onChangeText={(v) => setFormData({ ...formData, name: v })}
                                    />
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <AppInput
                                            label="Dosage"
                                            placeholder="500mg"
                                            value={formData.dosage}
                                            onChangeText={(v) => setFormData({ ...formData, dosage: v })}
                                            containerStyle={{ flex: 1 }}
                                        />
                                        <AppInput
                                            label="Frequency"
                                            placeholder="Daily"
                                            value={formData.frequency}
                                            onChangeText={(v) => setFormData({ ...formData, frequency: v })}
                                            containerStyle={{ flex: 1 }}
                                        />
                                    </View>
                                </>
                            )}

                            {activeTab === 'vaccinations' && (
                                <>
                                    <AppInput
                                        label="Vaccine Nomenclature"
                                        placeholder="e.g. COVID-19 Booster"
                                        value={formData.name}
                                        onChangeText={(v) => setFormData({ ...formData, name: v })}
                                    />
                                    <AppInput
                                        label="Clinical Provider"
                                        placeholder="e.g. General Hospital"
                                        value={formData.provider}
                                        onChangeText={(v) => setFormData({ ...formData, provider: v })}
                                    />
                                </>
                            )}

                            {activeTab === 'vitals' && (
                                <>
                                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ marginBottom: 12 }}>Select Vital Matrix</AppText>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                        {VITAL_TYPES.map(t => (
                                            <TouchableOpacity
                                                key={t.key}
                                                style={[styles.miniTab, formData.type === t.key && styles.miniTabActive]}
                                                onPress={() => setFormData({ ...formData, type: t.key })}
                                            >
                                                <AppText variant="caption" weight="black" style={{ color: formData.type === t.key ? 'white' : Theme.Colors.textSecondary }}>{t.label}</AppText>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    <AppInput
                                        label="Numeric Value"
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                        value={formData.value}
                                        onChangeText={(v) => setFormData({ ...formData, value: v })}
                                    />
                                    <AppInput
                                        label="Clinical Observations"
                                        placeholder="Add notes..."
                                        value={formData.notes}
                                        onChangeText={(v) => setFormData({ ...formData, notes: v })}
                                    />
                                </>
                            )}

                            <AppButton
                                title="Authorize Entry"
                                loading={submitting}
                                onPress={handleAdd}
                                style={{ marginTop: 24, height: 60, borderRadius: 20 }}
                            />
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    historyLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.card, marginHorizontal: 24, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.divider, ...Theme.Shadows.soft, marginBottom: 24 },
    iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    tabContainer: { marginBottom: 20 },
    tabsScroll: { paddingHorizontal: 24, gap: 10 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: Theme.Colors.surface, gap: 8, borderWidth: 1, borderColor: Theme.Colors.divider },
    tabActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },
    tabText: { textTransform: 'uppercase', letterSpacing: 0.5 },

    scrollContent: { paddingHorizontal: 24 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },

    recordCard: { marginBottom: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 6, marginTop: 4, alignSelf: 'flex-start' },
    dot: { width: 6, height: 6, borderRadius: 3 },
    smallCircleBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    reactionBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },

    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },

    severityPicker: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    severityOption: { flex: 1, padding: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface },

    miniTab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: Theme.Colors.surface, marginRight: 8, borderWidth: 1, borderColor: Theme.Colors.divider },
    miniTabActive: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },
});
