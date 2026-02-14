import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import Theme from '@/constants/Theme';

interface AssessmentSectionProps {
    diagnosis: string;
    setDiagnosis: (text: string) => void;
}

export const AssessmentSection = ({
    diagnosis,
    setDiagnosis
}: AssessmentSectionProps) => {

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <View style={styles.iconBg}>
                        <Text style={styles.sectionIcon}>A</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Assessment</Text>
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Primary Diagnosis</Text>
                <TextInput
                    style={[styles.input, { minHeight: 80 }]}
                    value={diagnosis}
                    onChangeText={setDiagnosis}
                    placeholder="Clinical diagnosis based on S & O..."
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
    iconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.Colors.warning, justifyContent: 'center', alignItems: 'center' },
    sectionIcon: { color: Theme.Colors.textInverted, fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.Colors.text },

    inputGroup: { marginBottom: 16 },
    label: { color: Theme.Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: Theme.Colors.surface, borderRadius: 12, padding: 16, color: Theme.Colors.text, fontSize: 16, borderWidth: 1, borderColor: Theme.Colors.divider },
});
