import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function SelectSlotScreen() {
    const { labId, labName, testIds, price } = useLocalSearchParams<{
        labId: string;
        labName: string;
        testIds: string;
        price: string;
    }>();

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [document, setDocument] = useState<any>(null);

    // Generate next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1);
        return {
            date: date.toISOString().split('T')[0],
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
        };
    });

    // Time slots
    const timeSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30',
    ];

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setDocument(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking clinical protocol document:', error);
            Alert.alert('Protocol Error', 'Failed to acquire document from local vault.');
        }
    };

    const handleContinue = () => {
        if (!selectedDate || !selectedTime) {
            Alert.alert('Temporal Requirement', 'A specific date and time allocation is mandatory.');
            return;
        }

        router.push({
            pathname: '/labs/confirm',
            params: {
                labId,
                labName,
                testIds,
                price,
                scheduledDate: selectedDate,
                scheduledTime: selectedTime,
                documentUri: document?.uri,
                documentName: document?.name,
                documentType: document?.mimeType,
            },
        });
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Temporal Slot</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <AppText variant="h2" weight="black">Slot Allocation</AppText>
                    <AppText variant="body" color="textSecondary" weight="black" style={{ marginTop: 4 }}>INSTITUTION: {labName?.toUpperCase()}</AppText>
                </View>

                {/* Date Selection */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.sectionLabel}>DIAGNOSTIC DATE</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesGrid}>
                        {dates.map(d => {
                            const isSelected = selectedDate === d.date;
                            return (
                                <TouchableOpacity
                                    key={d.date}
                                    style={[styles.dateCard, isSelected && styles.selectedCard]}
                                    onPress={() => setSelectedDate(d.date)}
                                >
                                    <AppText variant="caption" weight="black" style={{ color: isSelected ? 'white' : Theme.Colors.textSecondary, fontSize: 10 }}>{d.day.toUpperCase()}</AppText>
                                    <AppText variant="h3" weight="black" style={{ color: isSelected ? 'white' : Theme.Colors.text, marginVertical: 4 }}>{d.dayNum}</AppText>
                                    <AppText variant="caption" weight="black" style={{ color: isSelected ? 'white' : Theme.Colors.textSecondary, fontSize: 9 }}>{d.month.toUpperCase()}</AppText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Time Selection */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.sectionLabel}>ALLOCATED TIME (GMT+1)</AppText>
                    <View style={styles.timeGrid}>
                        {timeSlots.map(time => {
                            const isSelected = selectedTime === time;
                            return (
                                <TouchableOpacity
                                    key={time}
                                    style={[styles.timeSlot, isSelected && styles.selectedCard]}
                                    onPress={() => setSelectedTime(time)}
                                >
                                    <AppText variant="body" weight="black" style={{ color: isSelected ? 'white' : Theme.Colors.text }}>{time}</AppText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Document Upload */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.sectionLabel}>PREREQUISITE PRESCRIPTION (OPTIONAL)</AppText>
                    <AppCard padding="md" style={styles.uploadCard} onPress={pickDocument}>
                        <View style={styles.uploadContent}>
                            <View style={[styles.uploadIcon, document && { backgroundColor: Theme.Colors.success + '15' }]}>
                                <Ionicons name={document ? "checkmark-circle" : "cloud-upload-outline"} size={24} color={document ? Theme.Colors.success : Theme.Colors.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <AppText variant="body" weight="black">{document ? 'ASSET ENCRYPTED' : 'UPLOAD ASSET'}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">{document ? document.name : 'PDF or Image (Clinical authorization)'}</AppText>
                            </View>
                            {document && (
                                <TouchableOpacity onPress={() => setDocument(null)}>
                                    <Ionicons name="trash-outline" size={20} color={Theme.Colors.error} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </AppCard>
                </View>

                <View style={{ height: 140 }} />
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.engagementPreview}>
                    <AppText variant="caption" color="textSecondary" weight="black">ECONOMIC COMMITMENT</AppText>
                    <AppText variant="h2" weight="black" color="primary">{price} DZD</AppText>
                </View>
                <AppButton
                    title="VALIDATE ALLOCATION"
                    onPress={handleContinue}
                    disabled={!selectedDate || !selectedTime}
                    style={styles.mainBtn}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
    heroSection: { marginBottom: 32 },
    section: { marginBottom: 32 },
    sectionLabel: { fontSize: 9, marginBottom: 16, letterSpacing: 1 },

    datesGrid: { gap: 12 },
    dateCard: { width: 80, height: 110, borderRadius: 20, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, justifyContent: 'center', alignItems: 'center' },
    selectedCard: { backgroundColor: Theme.Colors.primary, borderColor: Theme.Colors.primary },

    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    timeSlot: { width: '22.8%', height: 56, borderRadius: 14, backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, justifyContent: 'center', alignItems: 'center' },

    uploadCard: { borderRadius: 24, borderStyle: 'dashed' },
    uploadContent: { flexDirection: 'row', alignItems: 'center' },
    uploadIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.background, borderTopWidth: 1, borderTopColor: Theme.Colors.divider, flexDirection: 'row', gap: 20, alignItems: 'center' },
    engagementPreview: { flex: 1 },
    mainBtn: { flex: 1.5, height: 60, borderRadius: 20, backgroundColor: Theme.Colors.text },
});
