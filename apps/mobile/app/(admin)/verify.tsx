import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { adminApi, VerificationRequest } from '@/services/admin.api';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function VerifyScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const request = JSON.parse(params.data as string) as VerificationRequest;
    const documents = request.documents ? JSON.parse(request.documents as unknown as string) : [];

    const [processing, setProcessing] = useState(false);

    const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
        setProcessing(true);
        try {
            await adminApi.verifyProvider(request.id, status);
            Alert.alert('Success', `Provider ${status.toLowerCase()} successfully`, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppScreen
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3">{request.type} Verification</AppText>
                <View style={{ width: 44 }} />
            </View>

            <AppCard variant="elevated" style={styles.card}>
                <View style={styles.row}>
                    <AppText variant="caption" color="textSecondary">Provider ID</AppText>
                    <AppText variant="body" weight="bold">{request.targetId}</AppText>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <AppText variant="caption" color="textSecondary">Submitted</AppText>
                    <AppText variant="body" weight="bold">{new Date(request.createdAt).toLocaleDateString()}</AppText>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <AppText variant="caption" color="textSecondary">Status</AppText>
                    <AppText variant="body" weight="black" style={{ color: Theme.Colors.warning }}>{request.status}</AppText>
                </View>
            </AppCard>

            <AppText variant="title" style={styles.sectionTitle}>Documents</AppText>
            <View style={styles.docList}>
                {documents.map((doc: string, index: number) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => Linking.openURL(doc)}
                    >
                        <AppCard style={styles.docCard}>
                            <Ionicons name="document-text" size={32} color={Theme.Colors.primary} />
                            <AppText variant="body" weight="bold" style={styles.docName}>Document {index + 1}</AppText>
                            <Ionicons name="open-outline" size={20} color={Theme.Colors.textSecondary} />
                        </AppCard>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.actions}>
                <AppButton
                    title="Reject"
                    variant="outline"
                    onPress={() => handleAction('REJECTED')}
                    loading={processing}
                    style={styles.rejectBtn}
                    textStyle={{ color: Theme.Colors.error }}
                />

                <AppButton
                    title="Approve"
                    onPress={() => handleAction('APPROVED')}
                    loading={processing}
                    style={styles.approveBtn}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.Colors.surfaceAlt,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    content: {
        paddingTop: 8,
    },
    card: {
        padding: 24,
        marginBottom: 32,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1.5,
        backgroundColor: Theme.Colors.divider,
        marginVertical: 16,
    },
    sectionTitle: {
        marginBottom: 20,
    },
    docList: {
        gap: 16,
        marginBottom: 40,
    },
    docCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    docName: {
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: Theme.Spacing.md,
        paddingBottom: 40,
    },
    approveBtn: {
        flex: 2,
    },
    rejectBtn: {
        flex: 1,
        borderColor: Theme.Colors.error + '40',
    },
});
