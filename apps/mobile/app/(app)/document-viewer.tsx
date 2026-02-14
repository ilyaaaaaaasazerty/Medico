import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { patientApi } from '@/services/patient.api';
import { WebView } from 'react-native-webview';
import { getFileUrl } from '@/utils/get-file-url';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText } from '@/components/base';
import Theme from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Document {
    id: string;
    name: string;
    type: string;
    fileUrl: string;
    mimeType?: string;
    uploadedAt: string;
    isShared: boolean;
}

export default function DocumentViewerScreen() {
    const { id, url, title, type } = useLocalSearchParams<{ id: string; url: string; title: string; type: string }>();
    const [loading, setLoading] = useState(!!id);
    const [document, setDocument] = useState<Document | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (id) {
            loadDocument();
        } else if (url) {
            setDocument({
                id: 'temp',
                name: title || 'Medical Document',
                type: type || 'DOCUMENT',
                fileUrl: url,
                uploadedAt: new Date().toISOString(),
                isShared: false,
            });
        }
    }, [id, url]);

    const loadDocument = async () => {
        if (!id) return;
        try {
            const res = await patientApi.getDocumentById(id);
            if (res.success && res.data) {
                setDocument(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical asset:', error);
        } finally {
            setLoading(false);
        }
    };

    const isImage = (mimeType?: string, url?: string) => {
        if (mimeType?.startsWith('image/')) return true;
        if (url?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)) return true;
        return false;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
                <AppText variant="caption" weight="black" color="textSecondary" style={{ marginTop: 16 }}>RETRIEVING SECURE ASSET...</AppText>
            </View>
        );
    }

    if (!document) {
        return (
            <AppScreen padding={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                        <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                    </TouchableOpacity>
                    <AppText variant="body" weight="black" uppercase>Asset Not Found</AppText>
                    <View style={{ width: 44 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconBg}>
                        <Ionicons name="document-outline" size={64} color={Theme.Colors.divider} />
                    </View>
                    <AppText variant="h3" weight="black">ACCESS RESTRICTED</AppText>
                    <AppText variant="body" color="textSecondary" align="center" weight="bold" style={{ marginTop: 12 }}>
                        This clinical asset is no longer available in the secure vault or your authorization has expired.
                    </AppText>
                </View>
            </AppScreen>
        );
    }

    const fileUri = getFileUrl(document.fileUrl);

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <AppText variant="body" weight="black" uppercase numberOfLines={1} style={{ fontSize: 13 }}>{document.name}</AppText>
                    <AppText variant="caption" color="primary" weight="black" style={{ fontSize: 8 }}>VERIFIED CLINICAL ASSET</AppText>
                </View>
                <TouchableOpacity style={styles.circleBtn}>
                    <Ionicons name="share-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {isImage(document.mimeType, document.fileUrl) ? (
                    <ImageViewer
                        imageUrls={[{ url: fileUri }]}
                        renderIndicator={() => <></>}
                        style={styles.imageViewer}
                        backgroundColor={Theme.Colors.background}
                        renderHeader={() => <View />}
                        renderFooter={() => <View />}
                        enableSwipeDown
                        onSwipeDown={() => router.back()}
                    />
                ) : (
                    <WebView
                        source={{ uri: fileUri }}
                        style={styles.webview}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={Theme.Colors.primary} />
                            </View>
                        )}
                    />
                )}
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    headerTitle: { flex: 1, alignItems: 'center', marginHorizontal: 16 },

    content: { flex: 1 },
    imageViewer: { flex: 1 },
    webview: { flex: 1, backgroundColor: Theme.Colors.background },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background + '80' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIconBg: { width: 120, height: 120, borderRadius: 40, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Theme.Colors.divider },
});
