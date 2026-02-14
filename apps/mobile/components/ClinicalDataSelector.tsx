import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doctorApi } from '@/services/doctor.api';
import { labApi } from '@/services/lab.api';
import Colors from '@/constants/Colors';

interface ClinicalDataSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (item: any, type: 'PRESCRIPTION' | 'MEDICAL_RECORD' | 'LAB_RESULT') => void;
    providerRole: 'DOCTOR' | 'LAB_ADMIN';
}

export default function ClinicalDataSelector({
    visible,
    onClose,
    onSelect,
    providerRole,
}: ClinicalDataSelectorProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'PRESCRIPTION' | 'MEDICAL_RECORD' | 'LAB_RESULT'>(
        providerRole === 'DOCTOR' ? 'PRESCRIPTION' : 'LAB_RESULT'
    );
    const [data, setData] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (visible) {
            loadData();
        }
    }, [visible, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            let res;
            if (activeTab === 'PRESCRIPTION') {
                res = await doctorApi.getMyPrescriptions();
            } else if (activeTab === 'MEDICAL_RECORD') {
                res = await doctorApi.getMedicalRecords();
            } else if (activeTab === 'LAB_RESULT') {
                res = await labApi.getLabRequests('COMPLETED');
            }

            if (res?.success && res.data) {
                setData(res.data);
            }
        } catch (error) {
            console.error('Error loading clinical data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.filter(item => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'PRESCRIPTION' || activeTab === 'MEDICAL_RECORD') {
            const patientName = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.toLowerCase();
            const diagnosis = (item.diagnosis || '').toLowerCase();
            return patientName.includes(query) || diagnosis.includes(query);
        } else {
            const patientName = `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`.toLowerCase();
            return patientName.includes(query);
        }
    });

    const renderItem = ({ item }: { item: any }) => {
        let title = '';
        let subtitle = '';
        let icon = 'document-text';
        let color = '#0A84FF';

        if (activeTab === 'PRESCRIPTION') {
            title = `Prescription for ${item.patient?.firstName} ${item.patient?.lastName}`;
            subtitle = `Issued on ${new Date(item.createdAt).toLocaleDateString()}`;
            icon = 'medical';
            color = '#FF2D55';
        } else if (activeTab === 'MEDICAL_RECORD') {
            title = `Record: ${item.diagnosis || 'General Visit'}`;
            subtitle = `${item.patient?.firstName} ${item.patient?.lastName} • ${new Date(item.visitDate || item.createdAt).toLocaleDateString()}`;
            icon = 'document-text';
            color = '#5856D6';
        } else if (activeTab === 'LAB_RESULT') {
            title = `Results for ${item.patient?.firstName} ${item.patient?.lastName}`;
            subtitle = `Completed on ${new Date(item.updatedAt).toLocaleDateString()}`;
            icon = 'flask';
            color = '#30D158';
        }

        return (
            <TouchableOpacity style={styles.itemCard} onPress={() => onSelect(item, activeTab)}>
                <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon as any} size={24} color={color} />
                </View>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
                    <Text style={styles.itemSubtitle}>{subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Attach Clinical Data</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {providerRole === 'DOCTOR' && (
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'PRESCRIPTION' && styles.activeTab]}
                                onPress={() => setActiveTab('PRESCRIPTION')}
                            >
                                <Text style={[styles.tabText, activeTab === 'PRESCRIPTION' && styles.activeTabText]}>
                                    Prescriptions
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'MEDICAL_RECORD' && styles.activeTab]}
                                onPress={() => setActiveTab('MEDICAL_RECORD')}
                            >
                                <Text style={[styles.tabText, activeTab === 'MEDICAL_RECORD' && styles.activeTabText]}>
                                    Records
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by patient name or diagnosis..."
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={filteredData}
                            renderItem={renderItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No matching data found</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1C1C1E',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#2C2C2E',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        color: '#888',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        margin: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemSubtitle: {
        color: '#888',
        fontSize: 13,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
    },
});
