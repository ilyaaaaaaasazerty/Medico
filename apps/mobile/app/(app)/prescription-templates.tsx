import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { router } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { useAuth } from '@/providers/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

interface Template {
    id: string;
    name: string;
    diagnosis?: string;
    medications: any[];
    instructions?: string;
}

export default function PrescriptionTemplatesScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [templateName, setTemplateName] = useState('');
    const [templateDiagnosis, setTemplateDiagnosis] = useState('');
    const [templateInstructions, setTemplateInstructions] = useState('');
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

    useEffect(() => {
        loadTemplates();
    }, [user]);

    const loadTemplates = async () => {
        if (!user) return;
        try {
            const res = await doctorApi.getTemplates();
            if (res.success && res.data) {
                setTemplates(res.data);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            Alert.alert('Protocol Error', 'Protocol identification is required for archival.');
            return;
        }

        setSaving(true);
        try {
            if (editingTemplate) {
                await doctorApi.updateTemplate(editingTemplate.id, {
                    name: templateName.trim(),
                    diagnosis: templateDiagnosis || undefined,
                    instructions: templateInstructions || undefined,
                });
            } else {
                await doctorApi.createTemplate({
                    name: templateName.trim(),
                    diagnosis: templateDiagnosis || undefined,
                    medications: [],
                    instructions: templateInstructions || undefined,
                });
            }

            setShowAddModal(false);
            resetForm();
            loadTemplates();
        } catch (error) {
            Alert.alert('System Error', 'Failed to commit protocol to clinical library');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        Alert.alert('Archive Protocol', 'Are you sure you want to decommission this clinical protocol?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Archive',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await doctorApi.deleteTemplate(id);
                        loadTemplates();
                    } catch (error) {
                        console.error('Error deleting template:', error);
                    }
                }
            }
        ]);
    };

    const handleEditTemplate = (template: Template) => {
        setEditingTemplate(template);
        setTemplateName(template.name);
        setTemplateDiagnosis(template.diagnosis || '');
        setTemplateInstructions(template.instructions || '');
        setShowAddModal(true);
    };

    const resetForm = () => {
        setTemplateName('');
        setTemplateDiagnosis('');
        setTemplateInstructions('');
        setEditingTemplate(null);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Protocol Library</AppText>
                <TouchableOpacity
                    style={[styles.circleBtn, { backgroundColor: Theme.Colors.primary + '10', borderColor: Theme.Colors.primary + '20' }]}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {templates.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="bookmarks-outline" size={64} color={Theme.Colors.divider} />
                        </View>
                        <AppText variant="h3" weight="black">Library Empty</AppText>
                        <AppText variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: 12 }}>
                            Construct reusable clinical protocols to accelerate your Pharmacological Requisition workflow.
                        </AppText>
                        <AppButton
                            title="Initialize Library"
                            onPress={() => setShowAddModal(true)}
                            style={{ marginTop: 32, width: '100%' }}
                        />
                    </View>
                ) : (
                    <View style={styles.templatesGrid}>
                        {templates.map((template) => (
                            <AppCard key={template.id} style={styles.templateCard} padding="md">
                                <View style={styles.templateHeader}>
                                    <View style={styles.protocolBadge}>
                                        <Ionicons name="document-text" size={20} color={Theme.Colors.primary} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <AppText variant="body" weight="black" numberOfLines={1}>{template.name}</AppText>
                                        <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: 9 }}>{template.medications?.length || 0} COMPONENT(S)</AppText>
                                    </View>
                                </View>

                                {template.diagnosis && (
                                    <View style={styles.indicationPreview}>
                                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8, marginBottom: 4 }}>Primary Indication</AppText>
                                        <AppText variant="caption" color="textSecondary" italic numberOfLines={2}>{template.diagnosis}</AppText>
                                    </View>
                                )}

                                <View style={styles.templateDivider} />

                                <View style={styles.templateActions}>
                                    <AppButton
                                        title="Deploy"
                                        onPress={() => router.back()}
                                        variant="tonal"
                                        size="sm"
                                        style={{ flex: 1, height: 40, borderRadius: 12 }}
                                    />
                                    <View style={styles.iconActions}>
                                        <TouchableOpacity
                                            style={styles.iconBtn}
                                            onPress={() => handleEditTemplate(template)}
                                        >
                                            <Ionicons name="options-outline" size={18} color={Theme.Colors.textSecondary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.iconBtn, { borderColor: Theme.Colors.error + '20' }]}
                                            onPress={() => handleDeleteTemplate(template.id)}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={Theme.Colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </AppCard>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <AppText variant="h3" weight="black">{editingTemplate ? 'Refine Protocol' : 'New Protocol Specification'}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold">ASSET ARCHIVAL</AppText>
                            </View>
                            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={24} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.field}>
                                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.fieldLabel}>Protocol Identifier *</AppText>
                                <AppInput
                                    value={templateName}
                                    onChangeText={setTemplateName}
                                    placeholder="e.g. Hypertension Protocol A"
                                />
                            </View>

                            <View style={styles.field}>
                                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.fieldLabel}>Primary Indication</AppText>
                                <AppInput
                                    value={templateDiagnosis}
                                    onChangeText={setTemplateDiagnosis}
                                    placeholder="Standard diagnostic indication"
                                />
                            </View>

                            <View style={styles.field}>
                                <AppText variant="caption" color="primary" weight="black" uppercase style={styles.fieldLabel}>Instructional Narrative</AppText>
                                <TextInput
                                    style={styles.textArea}
                                    value={templateInstructions}
                                    onChangeText={setTemplateInstructions}
                                    placeholder="Reusable instructions for patient terminal..."
                                    placeholderTextColor={Theme.Colors.textSecondary}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>

                            <View style={styles.guidanceBox}>
                                <Ionicons name="information-circle" size={18} color={Theme.Colors.primary} />
                                <AppText variant="caption" color="primary" weight="bold" style={{ marginLeft: 12, flex: 1, fontSize: 11 }}>
                                    Therapeutic regimen items can be appended to this protocol via the Active Session Console.
                                </AppText>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <AppButton
                                title={editingTemplate ? "Commit Changes" : "Archive Protocol"}
                                onPress={handleSaveTemplate}
                                loading={saving}
                                style={{ height: 60, borderRadius: 20 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },

    templatesGrid: { gap: 16 },
    templateCard: { borderWidth: 1, borderColor: Theme.Colors.divider },
    templateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    protocolBadge: { width: 40, height: 40, backgroundColor: Theme.Colors.primary + '10', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    indicationPreview: { backgroundColor: Theme.Colors.background, padding: 12, borderRadius: 12, marginBottom: 16 },
    templateDivider: { height: 1, backgroundColor: Theme.Colors.divider, marginBottom: 16 },
    templateActions: { flexDirection: 'row', alignItems: 'center' },
    iconActions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
    iconBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.Colors.surface, borderTopLeftRadius: 40, borderTopRightRadius: 40, height: '85%', overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 32, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    modalCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center' },

    modalScroll: { padding: 32 },
    field: { marginBottom: 28 },
    fieldLabel: { marginBottom: 8, letterSpacing: 1.5, fontSize: 10 },
    textArea: { backgroundColor: Theme.Colors.background, borderRadius: 16, padding: 16, fontSize: 15, color: Theme.Colors.text, borderWidth: 1, borderColor: Theme.Colors.divider, height: 120 },
    guidanceBox: { flexDirection: 'row', backgroundColor: Theme.Colors.primary + '05', padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '10', marginBottom: 40 },

    modalFooter: { padding: 32, paddingBottom: Platform.OS === 'ios' ? 48 : 32, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});
