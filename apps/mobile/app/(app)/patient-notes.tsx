import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';

interface Note {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export default function PatientNotesScreen() {
    const { patientId, patientName } = useLocalSearchParams<{ patientId: string; patientName?: string }>();
    const [loading, setLoading] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    useEffect(() => {
        // Mock loading or initial state for logic consistency
        setLoading(false);
    }, [patientId]);

    const handleAddNote = () => {
        if (!newNote.trim()) return;

        const note: Note = {
            id: Date.now().toString(),
            content: newNote.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        setNotes([note, ...notes]);
        setNewNote('');
    };

    const handleUpdateNote = () => {
        if (!editingNote || !newNote.trim()) return;

        setNotes(notes.map(n =>
            n.id === editingNote.id
                ? { ...n, content: newNote.trim(), updatedAt: new Date().toISOString() }
                : n
        ));
        setEditingNote(null);
        setNewNote('');
    };

    const handleDeleteNote = (id: string) => {
        Alert.alert('Archive Observation', 'Are you sure you want to permanently decommission this clinical observation?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Archive',
                style: 'destructive',
                onPress: () => setNotes(notes.filter(n => n.id !== id))
            }
        ]);
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setNewNote(note.content);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Clinical Observations</AppText>
                <View style={styles.securityBadge}>
                    <Ionicons name="shield-checkmark" size={18} color={Theme.Colors.success} />
                </View>
            </View>

            {patientName && (
                <View style={styles.patientContext}>
                    <View style={styles.patientAvatar}>
                        <AppText variant="caption" color="primary" weight="black">{patientName.charAt(0)}</AppText>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 9 }}>Subject Context</AppText>
                        <AppText variant="body" weight="black">{patientName}</AppText>
                    </View>
                </View>
            )}

            <View style={styles.inputArea}>
                <TextInput
                    style={styles.textArea}
                    value={newNote}
                    onChangeText={setNewNote}
                    placeholder="Record a clinical observation for this subject..."
                    placeholderTextColor={Theme.Colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                />
                <View style={styles.inputActions}>
                    <AppButton
                        title={editingNote ? 'Refine Observation' : 'Commit Observation'}
                        onPress={editingNote ? handleUpdateNote : handleAddNote}
                        disabled={!newNote.trim()}
                        style={{ flex: 1, borderRadius: 16 }}
                    >
                        <Ionicons name={editingNote ? "checkmark-done" : "add"} size={20} color="white" style={{ marginRight: 8 }} />
                    </AppButton>
                    {editingNote && (
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => { setEditingNote(null); setNewNote(''); }}
                        >
                            <AppText variant="caption" color="textSecondary" weight="black" uppercase>Cancel</AppText>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.privacyBanner}>
                <Ionicons name="lock-closed" size={16} color={Theme.Colors.primary} />
                <AppText variant="caption" color="primary" weight="bold" style={{ marginLeft: 12, flex: 1, fontSize: 11 }}>
                    <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 11 }}>ENCRYPTED LEDGER: </AppText>
                    Observations are confidential and restricted to authorized practitioner sessions only.
                </AppText>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {notes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="journal-outline" size={64} color={Theme.Colors.divider} />
                        </View>
                        <AppText variant="h3" weight="black">Ledger Empty</AppText>
                        <AppText variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: 12 }}>
                            Capture internal clinical remarks for localized session reference.
                        </AppText>
                    </View>
                ) : (
                    <View style={styles.notesTimeline}>
                        {notes.map((note) => (
                            <AppCard key={note.id} style={styles.noteCard} padding="md">
                                <AppText variant="body" color="text" style={{ lineHeight: 24, fontSize: 15 }}>{note.content}</AppText>
                                <View style={styles.noteDivider} />
                                <View style={styles.noteFooter}>
                                    <View style={styles.timestampRow}>
                                        <Ionicons name="time-outline" size={12} color={Theme.Colors.textSecondary} />
                                        <AppText variant="caption" color="textSecondary" weight="bold" style={{ marginLeft: 6 }}>{formatDate(note.updatedAt)}</AppText>
                                    </View>
                                    <View style={styles.noteActions}>
                                        <TouchableOpacity
                                            style={styles.actionBtn}
                                            onPress={() => handleEditNote(note)}
                                        >
                                            <Ionicons name="options-outline" size={18} color={Theme.Colors.primary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.actionBtn}
                                            onPress={() => handleDeleteNote(note.id)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={Theme.Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </AppCard>
                        ))}
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    securityBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.success + '10', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.success + '20' },

    patientContext: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
    patientAvatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },

    inputArea: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Theme.Colors.surface, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    textArea: { backgroundColor: Theme.Colors.background, borderRadius: 20, padding: 20, fontSize: 15, color: Theme.Colors.text, height: 140, marginBottom: 16, borderWidth: 1, borderColor: Theme.Colors.divider },
    inputActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    cancelBtn: { paddingHorizontal: 16 },

    privacyBanner: { flexDirection: 'row', backgroundColor: Theme.Colors.primary + '05', margin: 24, padding: 16, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '10' },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: Theme.Colors.divider },

    notesTimeline: { gap: 16 },
    noteCard: { borderWidth: 1, borderColor: Theme.Colors.divider },
    noteDivider: { height: 1, backgroundColor: Theme.Colors.divider, marginVertical: 16 },
    noteFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    timestampRow: { flexDirection: 'row', alignItems: 'center' },
    noteActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
});
