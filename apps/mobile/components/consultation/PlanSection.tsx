import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Theme from '@/constants/Theme';

interface PlanSectionProps {
    notes: string;
    setNotes: (text: string) => void;
    followUpNotes: string;
    setFollowUpNotes: (text: string) => void;

    // Ordered Items State
    orderedItems?: {
        lab: boolean;
        imaging: boolean;
        procedure: boolean;
    };
    hasPrescription?: boolean;

    // Interactions
    onPrescribe?: () => void;
    onOrderLab?: () => void;
    onOrderImaging?: () => void;
    onOrderProcedure?: () => void;
}

export const PlanSection = ({
    notes,
    setNotes,
    followUpNotes,
    setFollowUpNotes,
    orderedItems = { lab: false, imaging: false, procedure: false },
    hasPrescription = false,
    onPrescribe,
    onOrderLab,
    onOrderImaging,
    onOrderProcedure
}: PlanSectionProps) => {

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.titleContainer}>
                    <View style={styles.iconBg}>
                        <Text style={styles.sectionIcon}>P</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Plan & Orders</Text>
                </View>
            </View>

            {/* Treatment Instructions */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Treatment & Instructions</Text>
                <TextInput
                    style={[styles.input, { minHeight: 100 }]}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Care instructions not covered by scripts..."
                    placeholderTextColor={Theme.Colors.textDisabled}
                    multiline
                    textAlignVertical="top"
                />
            </View>

            {/* Action Buttons (Integrated Ordering) */}
            <View style={styles.actionsGrid}>
                {/* Prescribe */}
                <TouchableOpacity
                    style={[styles.actionCard, hasPrescription && styles.orderedCard]}
                    onPress={onPrescribe}
                >
                    <View style={[styles.actionIcon, { backgroundColor: hasPrescription ? Theme.Colors.success + '20' : Theme.Colors.primary + '20' }]}>
                        <Ionicons name="medkit" size={24} color={hasPrescription ? Theme.Colors.success : Theme.Colors.primary} />
                    </View>
                    <Text style={styles.actionLabel}>{hasPrescription ? 'Meds Prescribed' : 'Prescribe Meds'}</Text>
                    <Ionicons
                        name={hasPrescription ? "checkmark-circle" : "add-circle"}
                        size={20}
                        color={hasPrescription ? Theme.Colors.success : Theme.Colors.primary}
                        style={styles.addIcon}
                    />
                </TouchableOpacity>

                {/* Lab Order */}
                <TouchableOpacity
                    style={[styles.actionCard, orderedItems.lab && styles.orderedCard]}
                    onPress={onOrderLab}
                >
                    <View style={[styles.actionIcon, { backgroundColor: orderedItems.lab ? Theme.Colors.success + '20' : Theme.Colors.error + '20' }]}>
                        <Ionicons name="flask" size={24} color={orderedItems.lab ? Theme.Colors.success : Theme.Colors.error} />
                    </View>
                    <Text style={styles.actionLabel}>{orderedItems.lab ? 'Labs Ordered' : 'Order Labs'}</Text>
                    <Ionicons
                        name={orderedItems.lab ? "checkmark-circle" : "add-circle"}
                        size={20}
                        color={orderedItems.lab ? Theme.Colors.success : Theme.Colors.error}
                        style={styles.addIcon}
                    />
                </TouchableOpacity>

                {/* Imaging */}
                <TouchableOpacity
                    style={[styles.actionCard, orderedItems.imaging && styles.orderedCard]}
                    onPress={onOrderImaging}
                >
                    <View style={[styles.actionIcon, { backgroundColor: orderedItems.imaging ? Theme.Colors.success + '20' : '#BF5AF220' }]}>
                        <Ionicons name="scan" size={24} color={orderedItems.imaging ? Theme.Colors.success : '#BF5AF2'} />
                    </View>
                    <Text style={styles.actionLabel}>{orderedItems.imaging ? 'Imaging Ordered' : 'Radiology'}</Text>
                    <Ionicons
                        name={orderedItems.imaging ? "checkmark-circle" : "add-circle"}
                        size={20}
                        color={orderedItems.imaging ? Theme.Colors.success : '#BF5AF2'}
                        style={styles.addIcon}
                    />
                </TouchableOpacity>

                {/* Procedure */}
                <TouchableOpacity
                    style={[styles.actionCard, orderedItems.procedure && styles.orderedCard]}
                    onPress={onOrderProcedure}
                >
                    <View style={[styles.actionIcon, { backgroundColor: orderedItems.procedure ? Theme.Colors.success + '20' : Theme.Colors.warning + '20' }]}>
                        <Ionicons name="cut" size={24} color={orderedItems.procedure ? Theme.Colors.success : Theme.Colors.warning} />
                    </View>
                    <Text style={styles.actionLabel}>{orderedItems.procedure ? 'Proc. Ordered' : 'Procedures'}</Text>
                    <Ionicons
                        name={orderedItems.procedure ? "checkmark-circle" : "add-circle"}
                        size={20}
                        color={orderedItems.procedure ? Theme.Colors.success : Theme.Colors.warning}
                        style={styles.addIcon}
                    />
                </TouchableOpacity>
            </View>

            {/* Follow Up */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Follow Up</Text>
                <TextInput
                    style={styles.input}
                    value={followUpNotes}
                    onChangeText={setFollowUpNotes}
                    placeholder="e.g. Return in 2 weeks..."
                    placeholderTextColor={Theme.Colors.textDisabled}
                />
            </View>
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

    inputGroup: { marginBottom: 16 },
    label: { color: Theme.Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: Theme.Colors.surface, borderRadius: 12, padding: 16, color: Theme.Colors.text, fontSize: 16, borderWidth: 1, borderColor: Theme.Colors.divider },

    actionsGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 24 },
    actionCard: { width: '47%', backgroundColor: Theme.Colors.surface, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, ...Theme.Shadows.card },
    actionIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionLabel: { color: Theme.Colors.text, fontWeight: '600', fontSize: 14 },
    addIcon: { position: 'absolute', top: 10, right: 10 },
    orderedCard: { borderColor: Theme.Colors.success, backgroundColor: Theme.Colors.success + '05' }
});
