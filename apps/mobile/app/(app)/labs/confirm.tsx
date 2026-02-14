import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Theme from '@/constants/Theme';
import { labApi } from '@/services/lab.api';
import { patientApi } from '@/services/patient.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function ConfirmLabBookingScreen() {
    const { labId, labName, testIds, scheduledDate, scheduledTime, documentUri, documentName, documentType } = useLocalSearchParams<{
        labId: string;
        labName: string;
        testIds: string;
        scheduledDate: string;
        scheduledTime: string;
        documentUri?: string;
        documentName?: string;
        documentType?: string;
    }>();

    const [loading, setLoading] = useState(false);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            let prescriptionUrl = undefined;

            if (documentUri) {
                const uploadRes = await patientApi.uploadDocument({
                    type: 'PRESCRIPTION',
                    name: documentName || 'Clinical Protocol Asset',
                    file: {
                        uri: documentUri,
                        name: documentName,
                        mimeType: documentType || 'application/pdf',
                    }
                });

                if (uploadRes.success && uploadRes.data) {
                    prescriptionUrl = uploadRes.data.fileUrl;
                } else {
                    throw new Error('Asset synchronization failed.');
                }
            }

            const res = await labApi.bookLabRequest({
                labCenterId: labId!,
                testIds: testIds!.split(','),
                scheduledDate: scheduledDate!,
                scheduledTime: scheduledTime!,
                prescriptionUrl,
            });

            if (res.success) {
                router.replace({
                    pathname: '/labs/success',
                    params: {
                        labName,
                        scheduledDate,
                        scheduledTime,
                    },
                });
            } else {
                Alert.alert('Protocol Failure', res.error || 'Engagement authorization unsuccessful.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Diagnostic network synchronization error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Authorization</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.statusRow}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={styles.dotContainer}>
                            <View style={[styles.stepDot, i <= 3 && styles.activeDot]} />
                            {i < 3 && <View style={styles.stepLine} />}
                        </View>
                    ))}
                </View>

                {/* Audit Summary */}
                <AppCard padding="lg" style={styles.summaryCard}>
                    <AppText variant="caption" color="textSecondary" weight="black" style={styles.cardLabel}>AUDIT SUMMARY</AppText>

                    <View style={styles.auditRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="business" size={20} color={Theme.Colors.primary} />
                        </View>
                        <View style={styles.auditText}>
                            <AppText variant="caption" color="textSecondary" weight="black">INSTITUTION</AppText>
                            <AppText variant="body" weight="black">{labName?.toUpperCase()}</AppText>
                        </View>
                    </View>

                    <View style={styles.auditRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="calendar-clear" size={20} color={Theme.Colors.primary} />
                        </View>
                        <View style={styles.auditText}>
                            <AppText variant="caption" color="textSecondary" weight="black">TEMPORAL ALLOCATION</AppText>
                            <AppText variant="body" weight="black">{formatDate(scheduledDate!).toUpperCase()}</AppText>
                        </View>
                    </View>

                    <View style={styles.auditRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="time" size={20} color={Theme.Colors.primary} />
                        </View>
                        <View style={styles.auditText}>
                            <AppText variant="caption" color="textSecondary" weight="black">SLOT PRECISION</AppText>
                            <AppText variant="body" weight="black">{scheduledTime} (GMT+1)</AppText>
                        </View>
                    </View>

                    <View style={styles.auditRow}>
                        <View style={styles.iconBox}>
                            <Ionicons name="flask" size={20} color={Theme.Colors.primary} />
                        </View>
                        <View style={styles.auditText}>
                            <AppText variant="caption" color="textSecondary" weight="black">DIAGNOSTIC SCOPE</AppText>
                            <AppText variant="body" weight="black">{testIds?.split(',').length} PROFESSIONAL PARAMETERS</AppText>
                        </View>
                    </View>
                </AppCard>

                <View style={styles.securitySeal}>
                    <Ionicons name="shield-checkmark" size={24} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="textSecondary" weight="bold" style={styles.securityText}>
                        Authorized clinical engagement. Your diagnostic request has been successfully submitted to the laboratory.
                    </AppText>
                </View>

                <View style={{ height: 140 }} />
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="CONFIRM BOOKING"
                    loading={loading}
                    onPress={handleConfirm}
                    style={styles.mainBtn}
                    icon={<Ionicons name="checkmark-circle" size={20} color="white" />}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24, paddingTop: 8 },
    statusRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
    dotContainer: { flexDirection: 'row', alignItems: 'center' },
    stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.Colors.divider },
    activeDot: { width: 40, backgroundColor: Theme.Colors.primary },
    stepLine: { width: 24, height: 2, backgroundColor: Theme.Colors.divider, marginHorizontal: 8 },

    summaryCard: { borderRadius: 32, marginBottom: 24 },
    cardLabel: { fontSize: 9, letterSpacing: 1, marginBottom: 24 },
    auditRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider, marginRight: 16 },
    auditText: { flex: 1 },

    economicCard: { borderRadius: 32, marginBottom: 24 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    divider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 16 },
    warningGate: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: Theme.Colors.error + '08', padding: 12, borderRadius: 12 },

    securitySeal: { flexDirection: 'row', padding: 24, borderRadius: 28, backgroundColor: Theme.Colors.surface, gap: 16, alignItems: 'center' },
    securityText: { flex: 1, lineHeight: 20 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.background, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    mainBtn: { height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});
