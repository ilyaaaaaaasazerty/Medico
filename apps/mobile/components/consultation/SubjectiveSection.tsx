import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { differenceInYears, parseISO } from 'date-fns';
import Theme from '@/constants/Theme';

const QUICK_TEMPLATES = [
    { label: 'Routine Checkup', text: 'Patient presents for routine checkup. No acute complaints.' },
    { label: 'Flu Symptoms', text: 'Fever, cough, body aches. Suspected viral infection.' },
    { label: 'Follow-up', text: 'Follow-up on previous condition. Improving.' },
    { label: 'Pain Consult', text: 'Complaint of localized pain. Evaluating intensity and duration.' },
];

interface SubjectiveSectionProps {
    patientName?: string;
    healthProfile: any;
    chiefComplaint: string;
    setChiefComplaint: React.Dispatch<React.SetStateAction<string>>;
    symptoms: string;
    setSymptoms: React.Dispatch<React.SetStateAction<string>>;
    historyExpanded: boolean;
    setHistoryExpanded: (expanded: boolean) => void;
}

export const SubjectiveSection = ({
    patientName,
    healthProfile,
    chiefComplaint,
    setChiefComplaint,
    symptoms,
    setSymptoms,
    historyExpanded,
    setHistoryExpanded
}: SubjectiveSectionProps) => {

    const applyTemplate = (text: string) => {
        setChiefComplaint(prev => prev ? prev + ' ' + text : text);
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <View style={styles.iconBg}>
                        <Text style={styles.sectionIcon}>S</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Subjective</Text>
                </View>
            </View>

            {/* Patient Name context (Minimal) */}
            {patientName && (
                <View style={styles.patientHeaderMinimal}>
                    <Text style={styles.patientNameMinimal}>{patientName}</Text>
                    <TouchableOpacity onPress={() => setHistoryExpanded(!historyExpanded)} style={styles.historyToggleBtn}>
                        <Text style={styles.historyToggleText}>{historyExpanded ? 'Hide History' : 'View History'}</Text>
                        <Ionicons name={historyExpanded ? "chevron-up" : "chevron-down"} size={16} color="#0A84FF" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Expanded History */}
            {historyExpanded && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
                    {/* Allergies */}
                    {healthProfile?.allergies?.map((a: any, i: number) => (
                        <View key={`alg-${i}`} style={styles.allergyBadge}>
                            <Ionicons name="medical" size={12} color="#FF453A" />
                            <Text style={styles.alertText}>{a.name}</Text>
                        </View>
                    ))}
                    {/* Conditions */}
                    {healthProfile?.conditions?.map((c: any, i: number) => (
                        <View key={`cond-${i}`} style={styles.conditionBadge}>
                            <Ionicons name="warning" size={12} color="#FF9F0A" />
                            <Text style={styles.alertText}>{c.name}</Text>
                        </View>
                    ))}
                    {(!healthProfile?.allergies?.length && !healthProfile?.conditions?.length) && (
                        <Text style={styles.noHistory}>No critical history on file</Text>
                    )}
                </ScrollView>
            )}

            {/* Chief Complaint Input */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Chief Complaint</Text>
                <TextInput
                    style={styles.input}
                    value={chiefComplaint}
                    onChangeText={setChiefComplaint}
                    placeholder="Why is the patient here?"
                    placeholderTextColor={Theme.Colors.textDisabled}
                    multiline
                />

                {/* Quick Templates */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
                    {QUICK_TEMPLATES.map((t, i) => (
                        <TouchableOpacity key={i} style={styles.templateChip} onPress={() => applyTemplate(t.text)}>
                            <Text style={styles.templateText}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>History of Present Illness / Symptoms</Text>
                <TextInput
                    style={[styles.input, { minHeight: 80 }]}
                    value={symptoms}
                    onChangeText={setSymptoms}
                    placeholder="Patient's story..."
                    placeholderTextColor={Theme.Colors.textDisabled}
                    multiline
                    textAlignVertical="top"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: Theme.Spacing.lg },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.Spacing.md },
    titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center' },
    sectionIcon: { color: Theme.Colors.textInverted, fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.Colors.text },

    expandBtn: { padding: 8 },

    patientHeaderMinimal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Theme.Colors.surface, padding: 12, borderRadius: 10, marginBottom: 16, ...Theme.Shadows.card },
    patientNameMinimal: { color: Theme.Colors.text, fontWeight: 'bold', fontSize: 16 },
    historyToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    historyToggleText: { color: Theme.Colors.primary, fontSize: 13, fontWeight: '600' },

    historyScroll: { flexDirection: 'row', gap: 8, marginBottom: 16, paddingBottom: 4 },
    allergyBadge: { flexDirection: 'row', backgroundColor: Theme.Colors.error + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Theme.Colors.error + '50' },
    conditionBadge: { flexDirection: 'row', backgroundColor: Theme.Colors.warning + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Theme.Colors.warning + '50' },
    alertText: { color: Theme.Colors.text, fontSize: 12, fontWeight: '600' },
    noHistory: { color: Theme.Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },

    inputGroup: { marginBottom: 16 },
    label: { color: Theme.Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: Theme.Colors.surface, borderRadius: 12, padding: 16, color: Theme.Colors.text, fontSize: 16, minHeight: 50, borderWidth: 1, borderColor: Theme.Colors.divider },

    templateScroll: { marginTop: 12, gap: 8 },
    templateChip: { backgroundColor: Theme.Colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: Theme.Colors.divider },
    templateText: { color: Theme.Colors.text, fontSize: 13 }
});
