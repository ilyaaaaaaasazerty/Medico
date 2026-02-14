import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Theme from '@/constants/Theme';

interface ObjectiveSectionProps {
    bloodPressure: string;
    setBloodPressure: (text: string) => void;
    heartRate: string;
    setHeartRate: (text: string) => void;
    temperature: string;
    setTemperature: (text: string) => void;
    weight: string;
    setWeight: (text: string) => void;
    notes: string;
    setNotes: (text: string) => void;
    attachments: any[];
}

export const ObjectiveSection = ({
    bloodPressure,
    setBloodPressure,
    heartRate,
    setHeartRate,
    temperature,
    setTemperature,
    weight,
    setWeight,
    notes,
    setNotes,
    attachments
}: ObjectiveSectionProps) => {

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <View style={styles.iconBg}>
                        <Text style={styles.sectionIcon}>O</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Objective</Text>
                </View>
            </View>

            {/* Vital Signs (Compact Grid) */}
            <View style={styles.vitalsContainer}>
                <View style={styles.vitalCard}>
                    <Text style={styles.vitalLabel}>BP</Text>
                    <TextInput
                        style={styles.vitalValue}
                        placeholder="120/80"
                        placeholderTextColor="#666"
                        value={bloodPressure}
                        onChangeText={setBloodPressure}
                        keyboardType="numbers-and-punctuation"
                    />
                    <Text style={styles.unit}>mmHg</Text>
                </View>
                <View style={styles.vitalCard}>
                    <Text style={styles.vitalLabel}>HR</Text>
                    <TextInput
                        style={styles.vitalValue}
                        placeholder="--"
                        placeholderTextColor={Theme.Colors.textDisabled}
                        value={heartRate}
                        onChangeText={setHeartRate}
                        keyboardType="numeric"
                    />
                    <Text style={styles.unit}>bpm</Text>
                </View>
                <View style={styles.vitalCard}>
                    <Text style={styles.vitalLabel}>Temp</Text>
                    <TextInput
                        style={styles.vitalValue}
                        placeholder="--"
                        placeholderTextColor={Theme.Colors.textDisabled}
                        value={temperature}
                        onChangeText={setTemperature}
                        keyboardType="decimal-pad"
                    />
                    <Text style={styles.unit}>°C</Text>
                </View>
                <View style={styles.vitalCard}>
                    <Text style={styles.vitalLabel}>Weight</Text>
                    <TextInput
                        style={styles.vitalValue}
                        placeholder="--"
                        placeholderTextColor={Theme.Colors.textDisabled}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="decimal-pad"
                    />
                    <Text style={styles.unit}>kg</Text>
                </View>
            </View>

            {/* Physical Exam Notes */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Physical Examination Findings</Text>
                <TextInput
                    style={[styles.input, { minHeight: 80 }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="General appearance, HEENT, Cardio, Resp..."
                    placeholderTextColor={Theme.Colors.textDisabled}
                    multiline
                    textAlignVertical="top"
                />
            </View>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <View style={styles.attachmentsRow}>
                    <Text style={styles.label}>Attachments</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {attachments.map((doc) => (
                            <TouchableOpacity
                                key={doc.id}
                                style={styles.attachmentCard}
                                onPress={() => router.push({
                                    pathname: '/(app)/document-viewer',
                                    params: { url: doc.fileUrl, title: doc.name }
                                })}
                            >
                                <View style={styles.docIcon}>
                                    <Ionicons name="document-text" size={20} color={Theme.Colors.primary} />
                                </View>
                                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: Theme.Spacing.lg },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.Spacing.md },
    titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.Colors.success, justifyContent: 'center', alignItems: 'center' },
    sectionIcon: { color: Theme.Colors.textInverted, fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.Colors.text },

    vitalsContainer: { flexDirection: 'row', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
    vitalCard: { flex: 1, minWidth: '45%', backgroundColor: Theme.Colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Theme.Colors.divider },
    vitalLabel: { fontSize: 12, color: Theme.Colors.textSecondary, marginBottom: 4, textTransform: 'uppercase' },
    vitalValue: { fontSize: 20, color: Theme.Colors.text, fontWeight: 'bold', padding: 0 },
    unit: { fontSize: 12, color: Theme.Colors.textSecondary, position: 'absolute', right: 12, top: 12 },

    inputGroup: { marginBottom: 16 },
    label: { color: Theme.Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: Theme.Colors.surface, borderRadius: 12, padding: 16, color: Theme.Colors.text, fontSize: 16, borderWidth: 1, borderColor: Theme.Colors.divider },

    attachmentsRow: { marginTop: 8 },
    attachmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surfaceAlt, padding: 8, borderRadius: 8, gap: 8, paddingRight: 12 },
    docIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: Theme.Colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
    docName: { color: Theme.Colors.text, fontSize: 13, maxWidth: 100 }
});
