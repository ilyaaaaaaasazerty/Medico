import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messageApi, MessageThread, getDisplayName, getAvatarUrl } from '@/services/message.api';

import { useAuth } from '@/providers/AuthProvider';
import { AppScreen, AppText, AppCard } from '@/components/base';
import Theme from '@/constants/Theme';

export default function MessagesInboxScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [threads, setThreads] = useState<MessageThread[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchThreads = async () => {
        try {
            const res = await messageApi.getThreads();
            setThreads(res?.data || []);

        } catch (error) {
            console.error('Failed to synchronize communication ledger:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchThreads();
    }, []);

    const renderThread = ({ item }: { item: MessageThread }) => {
        const otherParticipant = item.participants.find(p => p.userId !== user?.id)?.user;
        const lastMessage = item.messages?.[0];
        const myParticipant = item.participants.find(p => p.userId === user?.id);
        const lastRead = myParticipant?.lastRead ? new Date(myParticipant.lastRead) : null;
        const lastMessageAt = lastMessage?.createdAt ? new Date(lastMessage.createdAt) : null;
        const isUnread = !!(lastMessageAt && (!lastRead || lastMessageAt > lastRead) && lastMessage?.senderId !== user?.id);

        return (
            <AppCard
                style={styles.threadCard}
                padding="none"
                onPress={() => router.push(`/(app)/messages/${item.id}`)}
            >
                <View style={styles.threadContent}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarCircle}>
                            {otherParticipant ? (
                                <AppText variant="body" weight="black" color="primary">
                                    {getDisplayName(otherParticipant)[0]}
                                </AppText>
                            ) : (
                                <Ionicons name="person-outline" size={20} color={Theme.Colors.primary} />
                            )}
                        </View>
                    </View>

                    <View style={styles.textContainer}>
                        <View style={styles.nameRow}>
                            <AppText variant="body" weight="black" uppercase style={{ fontSize: 13, flex: 1 }}>
                                {otherParticipant ? getDisplayName(otherParticipant) : 'Institutional Channel'}
                            </AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold" style={{ fontSize: 9 }}>
                                {lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </AppText>
                        </View>

                        <View style={styles.messageRow}>
                            <AppText
                                variant="caption"
                                color={isUnread ? 'text' : 'textSecondary'}
                                weight={isUnread ? 'black' : 'bold'}
                                numberOfLines={1}
                                style={{ flex: 1, marginTop: 2 }}
                            >
                                {lastMessage?.content || 'ESTABLISH SECURE LINK...'}
                            </AppText>
                            {isUnread && <View style={styles.unreadDot} />}
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Theme.Colors.divider} style={{ marginLeft: 8 }} />
                </View>
            </AppCard>
        );
    };


    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen padding={false} scrollable={false}>
            <View style={styles.header}>
                <View>
                    <AppText variant="caption" weight="black" color="primary" style={{ letterSpacing: 1.5 }}>Communication Ledger</AppText>
                    <AppText variant="h2" weight="black">Inbox</AppText>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="create-outline" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={threads}
                renderItem={renderThread}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="chatbubbles-outline" size={48} color={Theme.Colors.divider} />
                        </View>
                        <AppText variant="h3" weight="black">NO DIALOGUES</AppText>
                        <AppText variant="body" color="textSecondary" align="center" weight="bold" style={{ marginTop: 12 }}>
                            Communication channels are currently inactive.
                        </AppText>
                    </View>
                }
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    actionBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '20' },

    listContent: { paddingHorizontal: 24, paddingBottom: 40 },
    threadCard: { marginBottom: 16, borderRadius: 24 },
    threadContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },

    avatarContainer: { position: 'relative' },
    avatarCircle: { width: 48, height: 48, borderRadius: 18, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    onlineIndicator: { position: 'absolute', bottom: -1, right: -1, width: 14, height: 14, borderRadius: 7, backgroundColor: Theme.Colors.success, borderWidth: 2, borderColor: Theme.Colors.surface },

    textContainer: { flex: 1, marginLeft: 16 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    messageRow: { flexDirection: 'row', alignItems: 'center' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.Colors.primary, marginLeft: 8 },

    emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
    emptyIconBg: { width: 96, height: 96, borderRadius: 32, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});
