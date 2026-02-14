import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messageApi, Message, MessageThread, getDisplayName } from '@/services/message.api';

import { useAuth } from '@/providers/AuthProvider';
import { AppScreen, AppText } from '@/components/base';
import Theme from '@/constants/Theme';

export default function ChatThreadScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const [thread, setThread] = useState<MessageThread | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [threadRes, msgsRes] = await Promise.all([
                messageApi.getThread(id!),
                messageApi.getThreadMessages(id!)
            ]);
            setThread(threadRes?.data || null);
            setMessages(msgsRes?.data || []);

        } catch (error) {
            console.error('Failed to establish encrypted downlink:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            const res = await messageApi.sendMessage(id!, text);
            if (res.success && res.data) {
                setMessages(prev => [...prev, res.data!]);
                setText('');
            }
        } catch (error) {
            console.error('Failed to dispatch clinical data:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {

        const isMine = item.senderId === user?.id;
        const hasAsset = item.metadata?.assetId;

        return (
            <View style={[styles.messageWrapper, isMine ? styles.myWrapper : styles.theirWrapper]}>
                <View style={[
                    styles.bubble,
                    isMine ? styles.myBubble : styles.theirBubble,
                    hasAsset ? styles.assetBubble : null
                ]}>
                    {hasAsset && (
                        <TouchableOpacity
                            style={styles.assetChip}
                            onPress={() => router.push({ pathname: '/(app)/document-viewer', params: { id: item.metadata?.assetId, type: item.metadata?.assetType } })}
                        >
                            <Ionicons
                                name={item.metadata?.assetType === 'PRESCRIPTION' ? 'document-text' : 'pulse'}
                                size={18}
                                color={isMine ? 'white' : Theme.Colors.primary}
                            />
                            <AppText variant="caption" weight="black" style={{ color: isMine ? 'white' : Theme.Colors.primary, marginLeft: 8, fontSize: 10 }}>
                                {item.metadata?.assetType} ATTACHED
                            </AppText>
                        </TouchableOpacity>
                    )}
                    <AppText
                        variant="body"
                        weight="bold"
                        style={[styles.messageText, isMine ? styles.myText : styles.theirText]}
                    >
                        {item.content}
                    </AppText>
                    <AppText
                        variant="caption"
                        weight="black"
                        style={[styles.timestamp, isMine ? styles.myTimestamp : styles.theirTimestamp]}
                    >
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </AppText>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    const otherParticipant = thread?.participants.find(p => p.userId !== user?.id)?.user;


    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <AppText variant="body" weight="black" uppercase style={{ fontSize: 13 }}>
                        {otherParticipant ? getDisplayName(otherParticipant) : 'Institutional Channel'}
                    </AppText>

                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: otherParticipant?.online ? Theme.Colors.success : Theme.Colors.divider }]} />
                        <AppText variant="caption" color="textSecondary" weight="black" style={{ fontSize: 8 }}>
                            {otherParticipant?.online ? 'NODE ACTIVE' : 'NODE OFFLINE'}
                        </AppText>
                    </View>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="attach" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="DISPATCH SECURE MESSAGE..."
                        placeholderTextColor={Theme.Colors.divider}
                        value={text}
                        onChangeText={setText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!text.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Ionicons name="send" size={20} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    headerInfo: { flex: 1, marginLeft: 16 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    actionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    listContent: { padding: 24, paddingBottom: 40 },
    messageWrapper: { marginBottom: 16, flexDirection: 'row' },
    myWrapper: { justifyContent: 'flex-end' },
    theirWrapper: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '80%', padding: 16, borderRadius: 24 },
    myBubble: { backgroundColor: Theme.Colors.text, borderBottomRightRadius: 4 },
    theirBubble: { backgroundColor: Theme.Colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Theme.Colors.divider },
    assetBubble: { padding: 8, paddingBottom: 16 },
    assetChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Theme.Colors.divider },

    myText: { color: 'white' },
    theirText: { color: Theme.Colors.text },
    messageText: { fontSize: 14, lineHeight: 20 },

    timestamp: { fontSize: 8, marginTop: 4 },
    myTimestamp: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
    theirTimestamp: { color: Theme.Colors.textSecondary },

    inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: Theme.Colors.background, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
    input: { flex: 1, backgroundColor: Theme.Colors.surface, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, marginRight: 12, maxHeight: 120, color: Theme.Colors.text, fontWeight: 'bold', borderWidth: 1, borderColor: Theme.Colors.divider },
    sendBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Theme.Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
    sendBtnDisabled: { backgroundColor: Theme.Colors.divider, shadowOpacity: 0, elevation: 0 },
});
