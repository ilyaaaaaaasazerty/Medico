import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import Theme from '@/constants/Theme';
import { patientApi } from '@/services/patient.api';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

const DOCUMENT_TYPES = [
    { key: 'LAB_RESULT', label: 'Lab Result', icon: '🧪' },
    { key: 'PRESCRIPTION', label: 'Prescription', icon: '💊' },
    { key: 'IMAGING', label: 'Imaging', icon: '🩻' },
    { key: 'REPORT', label: 'Report', icon: '📋' },
    { key: 'INSURANCE', label: 'Insurance', icon: '🏥' },
    { key: 'ID_DOCUMENT', label: 'ID Card', icon: '🪪' },
    { key: 'OTHER', label: 'Other', icon: '📄' },
];

export default function UploadDocumentScreen() {
    const [selectedType, setSelectedType] = useState(DOCUMENT_TYPES[0]);
    const [name, setName] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!name.trim()) {
            Alert.alert('Clinical Validation', 'Please provide a descriptive nomenclature for this record');
            return;
        }

        if (!fileUrl.trim() && !selectedFile) {
            Alert.alert('System Error', 'No diagnostic file or source URL detected');
            return;
        }

        setUploading(true);
        try {
            const res = await patientApi.uploadDocument({
                type: selectedType.key,
                name: name.trim(),
                fileUrl: fileUrl.trim(),
                file: selectedFile,
            });

            if (res.success) {
                Alert.alert('Vault Updated', 'Clinical document archived successfully', [
                    { text: 'View Records', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Upload Failed', res.error || 'The medical vault is currently unavailable');
            }
        } catch (error) {
            Alert.alert('Connection Error', 'Failed to reach the clinical archiving service');
        } finally {
            setUploading(false);
        }
    };

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            setSelectedFile(asset);
            if (!name) {
                setName(asset.name.split('.')[0]);
            }
        } catch (err) {
            Alert.alert('Device Error', 'Failed to access local file system');
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Vault Intake</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Document Classification</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeGrid}>
                        {DOCUMENT_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.key}
                                style={[
                                    styles.typeCard,
                                    selectedType.key === type.key && styles.typeCardActive,
                                ]}
                                onPress={() => setSelectedType(type)}
                            >
                                <AppText style={styles.typeIcon}>{type.icon}</AppText>
                                <AppText variant="caption" weight="black" style={[
                                    styles.typeLabel,
                                    { color: selectedType.key === type.key ? 'white' : Theme.Colors.textSecondary }
                                ]}>{type.label}</AppText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Diagnostic Metadata</AppText>
                    <AppInput
                        label="Official Document Name"
                        placeholder="e.g. CBC Results - Dec 2024"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Source Acquisition</AppText>

                    <TouchableOpacity
                        style={[styles.uploadArea, selectedFile && styles.uploadAreaActive]}
                        onPress={pickFile}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.largeIconBox, { backgroundColor: selectedFile ? Theme.Colors.success + '10' : Theme.Colors.primary + '05' }]}>
                            <Ionicons
                                name={selectedFile ? "checkmark-circle" : "cloud-upload"}
                                size={40}
                                color={selectedFile ? Theme.Colors.success : Theme.Colors.primary}
                            />
                        </View>
                        <View style={{ alignItems: 'center', marginTop: 16 }}>
                            <AppText variant="body" weight="black">{selectedFile ? selectedFile.name : 'Ingest local file'}</AppText>
                            <AppText variant="caption" color="textSecondary" weight="bold">
                                {selectedFile
                                    ? `${(selectedFile.size! / 1024 / 1024).toFixed(2)} MB • Authorized`
                                    : 'PDF, Images, or Reports (Max 10MB)'}
                            </AppText>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={styles.line} />
                        <AppText variant="caption" color="textSecondary" weight="black" style={{ marginHorizontal: 16 }}>OR EXTERNAL LINK</AppText>
                        <View style={styles.line} />
                    </View>

                    <AppInput
                        label="Secure URL"
                        placeholder="https://clinical-provider.com/record/..."
                        value={fileUrl}
                        onChangeText={setFileUrl}
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="shield-checkmark" size={24} color={Theme.Colors.primary} />
                    <View style={{ flex: 1 }}>
                        <AppText variant="caption" weight="black">ENCRYPTED ARCHIVING</AppText>
                        <AppText variant="caption" color="textSecondary" weight="bold">All medical documents are secured with enterprise-grade encryption and only shared with verified providers.</AppText>
                    </View>
                </View>

                <AppButton
                    title="Archive to Vault"
                    loading={uploading}
                    onPress={handleUpload}
                    style={{ height: 64, borderRadius: 20, marginTop: 20 }}
                />
                <View style={{ height: 40 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    scrollContent: { paddingHorizontal: 24 },
    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },

    typeGrid: { gap: 10, paddingRight: 24 },
    typeCard: { width: 100, backgroundColor: Theme.Colors.surface, borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    typeCardActive: { borderColor: Theme.Colors.primary, backgroundColor: Theme.Colors.primary },
    typeIcon: { fontSize: 24, marginBottom: 8 },
    typeLabel: { fontSize: 10, textAlign: 'center' },

    uploadArea: { backgroundColor: Theme.Colors.surface, borderRadius: 28, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: Theme.Colors.divider, borderStyle: 'dashed' },
    uploadAreaActive: { borderColor: Theme.Colors.success, borderStyle: 'solid', backgroundColor: Theme.Colors.success + '05' },
    largeIconBox: { width: 80, height: 80, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    line: { flex: 1, height: 1, backgroundColor: Theme.Colors.divider },

    infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Theme.Colors.primary + '05', padding: 20, borderRadius: 24, gap: 16, borderWidth: 1, borderColor: Theme.Colors.primary + '15' },
});
