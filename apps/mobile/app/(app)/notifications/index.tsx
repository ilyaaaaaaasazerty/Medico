import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationApi, Notification } from '../../../services/notification.api';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationApi.getNotifications();
            setNotifications(data.data);
        } catch (error) {
            console.error('Failed to load alert protocols:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to acknowledge all protocols:', error);
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <AppCard
            padding="none"
            style={[styles.alertCard, !item.isRead && styles.unreadCard]}
            onPress={() => !item.isRead && handleMarkAsRead(item.id)}
        >
            <View style={styles.alertRow}>
                <View style={[styles.iconBox, { backgroundColor: item.isRead ? Theme.Colors.surface : Theme.Colors.primary + '10' }]}>
                    <Ionicons
                        name={item.type === 'MESSAGE_RECEIVED' ? 'chatbubble-ellipses' : 'notifications'}
                        size={20}
                        color={item.isRead ? Theme.Colors.textSecondary : Theme.Colors.primary}
                    />
                </View>
                <View style={styles.alertContent}>
                    <View style={styles.alertHeaderRow}>
                        <AppText variant="body" weight="black" style={{ color: item.isRead ? Theme.Colors.text : Theme.Colors.primary }}>{item.title}</AppText>
                        {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <AppText variant="caption" color="textSecondary" weight="bold" numberOfLines={2} style={styles.alertBody}>
                        {item.body}
                    </AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 9 }}>
                        {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </AppText>
                </View>
            </View>
        </AppCard>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Alert Protocols</AppText>
                <TouchableOpacity onPress={handleMarkAllRead}>
                    <AppText variant="caption" weight="black" color="primary" uppercase>Read All</AppText>
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <AppText variant="h2" weight="black">System Alerts</AppText>
                <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                    Critical clinical events and system-priority synchronization alerts dispatched to your medical terminal.
                </AppText>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyView}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="notifications-off-outline" size={48} color={Theme.Colors.divider} />
                            </View>
                            <AppText variant="body" weight="black" color="textSecondary">NO ACTIVE ALERTS</AppText>
                        </View>
                    }
                    refreshing={loading}
                    onRefresh={loadNotifications}
                />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    heroSection: { paddingHorizontal: 24, marginBottom: 8 },

    list: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
    alertCard: { marginBottom: 12, borderRadius: 20 },
    unreadCard: { borderColor: Theme.Colors.primary + '30', backgroundColor: Theme.Colors.primary + '03' },
    alertRow: { flexDirection: 'row', padding: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    alertContent: { flex: 1, marginLeft: 16 },
    alertHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.Colors.primary },
    alertBody: { marginBottom: 8, lineHeight: 18 },

    emptyView: { padding: 80, alignItems: 'center' },
    emptyIcon: { width: 80, height: 80, borderRadius: 30, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },
});
