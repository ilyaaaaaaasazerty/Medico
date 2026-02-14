import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Switch, Modal, Platform } from 'react-native';
import Theme from '@/constants/Theme';
import { router } from 'expo-router';
import { templateApi, DocumentTemplate } from '@/services/template.api';
import { useAuth } from '@/providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import Signature from 'react-native-signature-canvas';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

const COLORS = [
    '#0A84FF', '#32D74B', '#FF9F0A', '#FF375F', '#BF5AF2', '#64D2FF', '#5E5CE6', '#FFFFFF'
];

export default function DocumentTemplateEditorScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState<DocumentTemplate | null>(null);
    const [isClinicTemplate, setIsClinicTemplate] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    // Form state
    const [headerTitle, setHeaderTitle] = useState('');
    const [headerSubtitle, setHeaderSubtitle] = useState('');
    const [headerAddress, setHeaderAddress] = useState('');
    const [headerPhone, setHeaderPhone] = useState('');
    const [footerText, setFooterText] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#0A84FF');
    const [headerColor, setHeaderColor] = useState('#0A84FF');
    const [showRxSymbol, setShowRxSymbol] = useState(true);
    const [showDiagnosis, setShowDiagnosis] = useState(true);
    const [showPatientId, setShowPatientId] = useState(true);

    useEffect(() => {
        loadTemplate();
    }, []);

    const loadTemplate = async () => {
        try {
            const res = await templateApi.getPrescriptionTemplate();
            if (res.success && res.data) {
                setTemplate(res.data);
                setIsClinicTemplate(!!(res as any).isClinicTemplate);

                setHeaderTitle(res.data.headerTitle || '');
                setHeaderSubtitle(res.data.headerSubtitle || '');
                setHeaderAddress(res.data.headerAddress || '');
                setHeaderPhone(res.data.headerPhone || '');
                setFooterText(res.data.footerText || '');
                setPrimaryColor(res.data.primaryColor || '#0A84FF');
                setHeaderColor(res.data.headerColor || '#0A84FF');
                setShowRxSymbol(res.data.showRxSymbol !== false);
                setShowDiagnosis(res.data.showDiagnosis !== false);
                setShowPatientId(res.data.showPatientId !== false);
            }
        } catch (error) {
            console.error('Error loading template:', error);
            Alert.alert('Configuration Error', 'Institutional blueprints could not be retrieved.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (isClinicTemplate) {
            Alert.alert('Restricted Protocol', 'Institutional defaults are locked. Only clinic administrators can authorize blueprint modifications.');
            return;
        }

        setSaving(true);
        try {
            await templateApi.updatePrescriptionTemplate({
                headerTitle,
                headerSubtitle,
                headerAddress,
                headerPhone,
                footerText,
                primaryColor,
                headerColor,
                showRxSymbol,
                showDiagnosis,
                showPatientId,
            });
            Alert.alert('Success', 'Prescription blueprint updated in the clinical registry.');
        } catch (error) {
            Alert.alert('Sync Error', 'Failed to commit blueprint changes to the server.');
        } finally {
            setSaving(false);
        }
    };

    const pickLogo = async () => {
        if (isClinicTemplate) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0].uri) {
            try {
                setSaving(true);
                const res = await templateApi.uploadLogo(result.assets[0].uri);
                if (res.success) {
                    setTemplate(res.data);
                }
            } catch (error) {
                Alert.alert('Asset Error', 'Failed to upload institutional logo.');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleSignature = async (signature: string) => {
        try {
            setSaving(true);
            setShowSignatureModal(false);

            const base64Data = signature.replace('data:image/png;base64,', '');
            const fileUri = (FileSystem as any).cacheDirectory + `signature-${Date.now()}.png`;
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                encoding: (FileSystem as any).EncodingType.Base64
            });

            const res = await templateApi.uploadSignature(fileUri);
            if (res.success) {
                setTemplate(res.data);
                Alert.alert('Authorization Logged', 'Signature asset has been successfully committed.');
            }
        } catch (error) {
            Alert.alert('Authorization Error', 'Failed to commit signature asset.');
        } finally {
            setSaving(false);
        }
    };

    const pickSignature = async () => {
        if (isClinicTemplate) return;

        Alert.alert(
            'Authorization Asset',
            'Define methodology for signature/stamp acquisition.',
            [
                { text: 'Digital Input', onPress: () => setShowSignatureModal(true) },
                {
                    text: 'Asset Upload',
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [2, 1],
                            quality: 0.7,
                        });

                        if (!result.canceled && result.assets[0].uri) {
                            try {
                                setSaving(true);
                                const res = await templateApi.uploadSignature(result.assets[0].uri);
                                if (res.success) {
                                    setTemplate(res.data);
                                }
                            } catch (error) {
                                Alert.alert('Asset Error', 'Failed to upload signature asset.');
                            } finally {
                                setSaving(false);
                            }
                        }
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
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
                <View style={{ alignItems: 'center' }}>
                    <AppText variant="h3" weight="black">RX Blueprint terminal</AppText>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: 8 }}>Prescription Designer</AppText>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={saving || isClinicTemplate} style={styles.saveTrigger}>
                    {saving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="checkmark" size={24} color="white" />}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {isClinicTemplate && (
                    <View style={styles.lockBanner}>
                        <Ionicons name="lock-closed" size={16} color={Theme.Colors.primary} />
                        <AppText variant="caption" color="primary" weight="bold" style={{ marginLeft: 10, flex: 1 }}>
                            Institutional Default Active: Modification of this blueprint is restricted to administrative clearance.
                        </AppText>
                    </View>
                )}

                {/* Preview Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Real-time Schematic</AppText>
                    <AppCard padding="none" style={styles.previewContainer}>
                        <View style={styles.previewHeader}>
                            {template?.logoUrl ? (
                                <Image source={{ uri: template.logoUrl }} style={styles.previewLogo} />
                            ) : (
                                <View style={[styles.previewLogo, { backgroundColor: Theme.Colors.divider }]} />
                            )}
                            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <AppText variant="body" weight="black" style={{ color: primaryColor }}>{headerTitle || 'MEDICO'}</AppText>
                                <AppText variant="caption" weight="bold" color="textSecondary" style={{ fontSize: 10 }}>{headerSubtitle || 'Institutional Clinic'}</AppText>
                                <AppText variant="caption" style={{ fontSize: 8, opacity: 0.7 }}>{headerAddress || 'Clinical Site Alpha'}</AppText>
                            </View>
                        </View>

                        {showRxSymbol && (
                            <AppText variant="h1" weight="black" style={{ color: primaryColor, fontSize: 32, marginBottom: 12 }}>Rx</AppText>
                        )}

                        <View style={styles.previewBody}>
                            <View style={styles.bodyLine} />
                            <View style={[styles.bodyLine, { width: '60%', marginTop: 8 }]} />
                        </View>

                        <View style={styles.previewFooter}>
                            {template?.signatureUrl && (
                                <Image source={{ uri: template.signatureUrl }} style={styles.previewSig} />
                            )}
                            <View style={styles.footerLine} />
                            <AppText variant="caption" color="textSecondary" style={{ fontSize: 7, textAlign: 'center', marginTop: 8 }}>{footerText || 'Digital Authorization Record'}</AppText>
                        </View>
                    </AppCard>
                </View>

                {/* Assets Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Institutional Assets</AppText>
                    <View style={styles.assetGrid}>
                        <TouchableOpacity style={styles.assetBox} onPress={pickLogo} disabled={isClinicTemplate}>
                            {template?.logoUrl ? (
                                <Image source={{ uri: template.logoUrl }} style={styles.fullImg} />
                            ) : (
                                <Ionicons name="business-outline" size={32} color={Theme.Colors.divider} />
                            )}
                            <AppText variant="caption" weight="black" uppercase style={{ fontSize: 8, marginTop: 12 }}>Corporate Logo</AppText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.assetBox} onPress={pickSignature} disabled={isClinicTemplate}>
                            {template?.signatureUrl ? (
                                <Image source={{ uri: template.signatureUrl }} style={styles.fullImg} resizeMode="contain" />
                            ) : (
                                <Ionicons name="create-outline" size={32} color={Theme.Colors.divider} />
                            )}
                            <AppText variant="caption" weight="black" uppercase style={{ fontSize: 8, marginTop: 12 }}>Auth Signature</AppText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Parameters Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Visual Parameters</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                        {COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[styles.colorDisk, { backgroundColor: color }, primaryColor === color && styles.colorDiskActive]}
                                onPress={() => !isClinicTemplate && setPrimaryColor(color)}
                            >
                                {primaryColor === color && <Ionicons name="checkmark" size={16} color={color === '#FFFFFF' ? 'black' : 'white'} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Identity Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Identity Protocol</AppText>
                    <AppCard padding="md" style={styles.formCard}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.fieldLabel}>Practice Denomination</AppText>
                        <TextInput
                            style={styles.terminalInput}
                            value={headerTitle}
                            onChangeText={setHeaderTitle}
                            placeholder="e.g. Specialized Clinical Unit"
                            editable={!isClinicTemplate}
                        />

                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={[styles.fieldLabel, { marginTop: 20 }]}>Descriptor</AppText>
                        <TextInput
                            style={styles.terminalInput}
                            value={headerSubtitle}
                            onChangeText={setHeaderSubtitle}
                            placeholder="e.g. Diagnostic Center"
                            editable={!isClinicTemplate}
                        />

                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={[styles.fieldLabel, { marginTop: 20 }]}>Geographic Coordinate</AppText>
                        <TextInput
                            style={styles.terminalInput}
                            value={headerAddress}
                            onChangeText={setHeaderAddress}
                            placeholder="Clinical Site Address"
                            editable={!isClinicTemplate}
                        />
                    </AppCard>
                </View>

                {/* Logic Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Operational Toggles</AppText>
                    <AppCard padding="none" style={styles.toggleCard}>
                        {[
                            { label: 'Display Rx Symbol', sub: 'Traditional clinical indicator', val: showRxSymbol, set: setShowRxSymbol },
                            { label: 'Include Clinical Assessment', sub: 'Manifest diagnosis in file', val: showDiagnosis, set: setShowDiagnosis },
                            { label: 'Expose Subject ID', sub: 'Temporal identifier for audit', val: showPatientId, set: setShowPatientId }
                        ].map((t, i) => (
                            <View key={i} style={[styles.toggleRow, i < 2 && styles.toggleDivider]}>
                                <View style={{ flex: 1 }}>
                                    <AppText variant="body" weight="black">{t.label}</AppText>
                                    <AppText variant="caption" color="textSecondary" weight="bold">{t.sub}</AppText>
                                </View>
                                <Switch
                                    value={t.val}
                                    onValueChange={t.set}
                                    disabled={isClinicTemplate}
                                    trackColor={{ false: Theme.Colors.divider, true: Theme.Colors.primary }}
                                />
                            </View>
                        ))}
                    </AppCard>
                </View>

                {/* Footer Section */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Temporal Directives</AppText>
                    <AppCard padding="md" style={styles.formCard}>
                        <TextInput
                            style={[styles.terminalInput, { height: 100, textAlignVertical: 'top' }]}
                            value={footerText}
                            onChangeText={setFooterText}
                            placeholder="Authorized instructions or legal caveats..."
                            multiline
                            editable={!isClinicTemplate}
                        />
                    </AppCard>
                </View>
            </ScrollView>

            <Modal visible={showSignatureModal} animationType="slide">
                <AppScreen padding={false}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowSignatureModal(false)} style={styles.circleBtn}>
                            <Ionicons name="close" size={24} color={Theme.Colors.error} />
                        </TouchableOpacity>
                        <AppText variant="h3" weight="black">Digital Authorization</AppText>
                        <View style={{ width: 44 }} />
                    </View>
                    <View style={{ flex: 1, backgroundColor: 'white' }}>
                        <Signature
                            onOK={handleSignature}
                            descriptionText="Authorize blueprint with manual input"
                            clearText="Purge"
                            confirmText="Commit"
                            webStyle={`.m-signature-pad--footer { display: flex; justify-content: space-around; padding: 20px; } .button { background-color: ${Theme.Colors.primary}; color: white; padding: 12px 30px; border-radius: 12px; font-weight: bold; } .button.clear { background-color: #333; }`}
                        />
                    </View>
                </AppScreen>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    saveTrigger: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.primary },

    scroll: { flex: 1 },
    scrollContent: { paddingTop: 16 },
    lockBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.primary + '08', padding: 16, marginHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.primary + '20', marginBottom: 20 },

    section: { paddingHorizontal: 24, marginBottom: 24 },
    sectionLabel: { fontSize: 8, letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 },

    previewContainer: { backgroundColor: 'white', borderBlockColor: Theme.Colors.divider, borderWidth: 1, padding: 24, borderRadius: 24, ...Theme.Shadows.soft },
    previewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    previewLogo: { width: 48, height: 48, borderRadius: 12 },
    previewBody: { paddingVertical: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F0', marginBottom: 24 },
    bodyLine: { height: 8, backgroundColor: '#F5F5F5', borderRadius: 4, width: '100%' },
    previewFooter: { alignItems: 'center' },
    previewSig: { width: 100, height: 50, marginBottom: 12, opacity: 0.8 },
    footerLine: { width: 60, height: 1, backgroundColor: '#EEE' },

    assetGrid: { flexDirection: 'row', gap: 16 },
    assetBox: { flex: 1, height: 140, backgroundColor: Theme.Colors.surface, borderRadius: 24, borderWidth: 1, borderColor: Theme.Colors.divider, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    fullImg: { width: '80%', height: '60%', borderRadius: 12 },

    colorScroll: { paddingLeft: 4 },
    colorDisk: { width: 44, height: 44, borderRadius: 22, marginRight: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    colorDiskActive: { borderColor: Theme.Colors.primary },

    formCard: { borderWidth: 1, borderColor: Theme.Colors.divider },
    fieldLabel: { fontSize: 7, letterSpacing: 1, marginBottom: 8, marginLeft: 2 },
    terminalInput: { backgroundColor: Theme.Colors.background, borderRadius: 16, padding: 16, fontSize: 16, color: Theme.Colors.text, borderWidth: 1, borderColor: Theme.Colors.divider, fontWeight: '600' },

    toggleCard: { borderWidth: 1, borderColor: Theme.Colors.divider },
    toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    toggleDivider: { borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },

    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
});
