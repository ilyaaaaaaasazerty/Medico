import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { messageApi, getDisplayName, getAvatarUrl, MessageThread } from '@/services/message.api';
import { useAuth } from '@/providers/AuthProvider';
import { format } from 'date-fns';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';

export default function MessagesScreen() {
    const router = useRouter();
    const [threads, setThreads] = useState<MessageThread[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        loadThreads();
    }, []);

    const loadThreads = async () => {
        try {
            setLoading(true);
            const res = await messageApi.getThreads();
            if (res.success) setThreads(res.data);
        } catch (error) {
            console.error('Error loading threads:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: MessageThread }) => {
        const otherParticipant = item.participants.find(p => p.userId !== user?.id);
        if (!otherParticipant) return null;

        const displayName = getDisplayName(otherParticipant.user);
        const avatarUrl = getAvatarUrl(otherParticipant.user);
        const lastMsg = item.messages[0];
        const unreadCount = item.messages.filter(m => !m.isRead && m.senderId !== user?.id).length;
        const hasUnread = unreadCount > 0;

        return (
            <TouchableOpacity
                style={styles.threadItem}
                onPress={() => router.push({
                    pathname: '/(app)/messages/[id]',
                    params: { id: item.id, name: displayName }
                })}
            >
                <View>
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <AppText weight="bold" color="primary" style={{ fontSize: 20 }}>{displayName[0]}</AppText>
                        )}
                    </View>
                    {hasUnread && <View style={styles.onlineBadge} />}
                </View>

                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <AppText weight="bold" style={{ fontSize: 16 }}>{displayName}</AppText>
                        <AppText variant="caption" color="textSecondary">
                            {lastMsg ? format(new Date(lastMsg.createdAt), 'h:mm a') : ''}
                        </AppText>
                    </View>
                    <AppText variant="caption" color="primary" style={{ marginBottom: 4 }}>
                        {otherParticipant.user.role.replace(/_/g, ' ')}
                    </AppText>
                    <AppText
                        variant="body"
                        color={hasUnread ? 'text' : 'textSecondary'}
                        weight={hasUnread ? 'bold' : 'regular'}
                        numberOfLines={1}
                    >
                        {lastMsg ? lastMsg.content : 'No messages yet'}
                    </AppText>
                </View>

                {hasUnread && (
                    <View style={styles.badge}>
                        <AppText weight="black" style={{ color: Theme.Colors.textInverted, fontSize: 10 }}>
                            {unreadCount}
                        </AppText>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <AppText variant="title">Messages</AppText>
                <TouchableOpacity style={styles.newChatBtn}>
                    <Ionicons name="create-outline" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <AppInput
                    placeholder="Search messages..."
                    icon={<Ionicons name="search" size={20} color={Theme.Colors.textSecondary} />}
                    containerStyle={{ marginBottom: 0 }}
                />
            </View>

            <View style={{ paddingHorizontal: Theme.Spacing.lg }}>
                <AppCard style={styles.quickQuestionCard} variant="elevated" padding="md">
                    <View style={styles.quickIconBg}>
                        <Ionicons name="flash" size={24} color={Theme.Colors.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppText weight="bold">Quick Question?</AppText>
                        <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                            Ask your care team a quick question without an appointment.
                        </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Theme.Colors.divider} />
                </AppCard>
            </View>

            <FlatList
                data={threads}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={64} color={Theme.Colors.divider} />
                        <AppText color="textSecondary" style={{ marginTop: 16 }}>
                            {loading ? 'Loading messages...' : 'No conversations yet.'}
                        </AppText>
                    </View>
                )}
                onRefresh={loadThreads}
                refreshing={loading}
            />
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.Spacing.lg,
        paddingTop: Theme.Spacing.lg,
        paddingBottom: Theme.Spacing.md,
    },
    newChatBtn: {
        width: 44,
        height: 44,
        backgroundColor: Theme.Colors.surface,
        borderRadius: Theme.Radii.lg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.Colors.divider,
    },
    searchContainer: {
        paddingHorizontal: Theme.Spacing.lg,
        marginBottom: Theme.Spacing.lg,
    },
    quickQuestionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: Theme.Colors.warning,
        borderColor: Theme.Colors.divider,
    },
    quickIconBg: {
        width: 44,
        height: 44,
        borderRadius: Theme.Radii.full,
        backgroundColor: Theme.Colors.overlayPressed,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.Spacing.md,
    },
    list: {
        paddingHorizontal: Theme.Spacing.lg,
        paddingBottom: 100,
    },
    threadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Theme.Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Theme.Colors.divider,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: Theme.Radii.full,
        backgroundColor: Theme.Colors.overlayPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.Spacing.md,
        overflow: 'hidden',
    },
    avatar: {
        width: 60,
        height: 60,
    },
    onlineBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Theme.Colors.success,
        position: 'absolute',
        bottom: 0,
        right: Theme.Spacing.md,
        borderWidth: 2,
        borderColor: Theme.Colors.surface,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    badge: {
        backgroundColor: Theme.Colors.primary,
        borderRadius: Theme.Radii.full,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginLeft: Theme.Spacing.sm,
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
    },
});
