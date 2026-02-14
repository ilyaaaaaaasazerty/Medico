import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { doctorApi } from '@/services/doctor.api';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen, AppText, AppCard, AppInput, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

interface Specialty {
    id: string;
    name: string;
    isPrimary?: boolean;
}

export default function ManageSpecialtiesScreen() {
    const router = useRouter();
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [myRes, allRes] = await Promise.all([
                doctorApi.getProfile(),
                doctorApi.getAllSpecialties()
            ]);

            if (myRes.success && myRes.data) {
                setSpecialties(myRes.data.specialties || []);
            }
            if (allRes.success && allRes.data) {
                setAllSpecialties(allRes.data);
            }
        } catch (error) {
            console.error('Error loading specialties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (specialtyId: string) => {
        try {
            const res = await doctorApi.addSpecialty(specialtyId);
            if (res.success) {
                const added = allSpecialties.find(s => s.id === specialtyId);
                if (added) setSpecialties([...specialties, added]);
                setModalVisible(false);
                setSearchQuery('');
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to register clinical specialty.');
        }
    };

    const handleRemove = (id: string, name: string) => {
        Alert.alert('Dissociate Specialty', `Permanently remove ${name} from your profile?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm Removal',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await doctorApi.removeSpecialty(id);
                        setSpecialties(specialties.filter(s => s.id !== id));
                    } catch (error) {
                        Alert.alert('Error', 'Removal operation failed.');
                    }
                }
            }
        ]);
    };

    const filtered = allSpecialties.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !specialties.find(my => my.id === s.id)
    );

    const renderItem = ({ item }: { item: Specialty }) => (
        <AppCard
            style={styles.card}
            padding="md"
        >
            <View style={styles.cardIcon}>
                <Ionicons name="medical" size={20} color={Theme.Colors.primary} />
            </View>
            <View style={styles.cardContent}>
                <AppText variant="body" weight="bold">{item.name}</AppText>
                {item.isPrimary && (
                    <View style={styles.primaryBadge}>
                        <AppText variant="caption" color="textInverted" weight="black">PRIMARY</AppText>
                    </View>
                )}
            </View>
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id, item.name)}>
                <Ionicons name="trash-outline" size={18} color={Theme.Colors.error} />
            </TouchableOpacity>
        </AppCard>
    );

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
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="bold">Specializations</AppText>
                <TouchableOpacity style={styles.addIconBtn} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={28} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={{ marginBottom: 24 }}>
                    <AppText variant="h2" weight="black">Clinical Expertise</AppText>
                    <AppText variant="body" color="textSecondary">Manage your certified medical fields.</AppText>
                </View>

                <FlatList
                    data={specialties}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconBox}>
                                <Ionicons name="ribbon" size={48} color={Theme.Colors.textSecondary} />
                            </View>
                            <AppText variant="h3" weight="bold" style={{ marginBottom: 8 }}>No specialties listed</AppText>
                            <AppText variant="body" color="textSecondary" align="center" style={{ maxWidth: 240 }}>
                                Add your professional domains to increase visibility.
                            </AppText>
                            <AppButton
                                title="Add First Specialty"
                                onPress={() => setModalVisible(true)}
                                style={styles.emptyAddBtn}
                            />
                        </View>
                    }
                />
            </View>

            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <AppCard style={styles.modalContent} padding="lg">
                        <View style={styles.modalHeader}>
                            <AppText variant="title">Add Specialty</AppText>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Theme.Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <AppInput
                            placeholder="Filter medical domains..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            icon={<Ionicons name="search" size={18} color={Theme.Colors.textSecondary} />}
                            autoFocus
                            containerStyle={{ marginBottom: 16 }}
                        />

                        <FlatList
                            data={filtered}
                            keyExtractor={item => item.id}
                            style={styles.searchList}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.searchResult} onPress={() => handleAdd(item.id)}>
                                    <AppText variant="body" weight="bold">{item.name}</AppText>
                                    <Ionicons name="add-circle" size={24} color={Theme.Colors.primary} />
                                </TouchableOpacity>
                            )}
                        />
                    </AppCard>
                </View>
            </Modal>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.soft },
    addIconBtn: { padding: 4 },

    content: { flex: 1, paddingHorizontal: 24 },
    list: { paddingBottom: 40 },

    card: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    cardContent: { flex: 1 },
    primaryBadge: { alignSelf: 'flex-start', backgroundColor: Theme.Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    removeBtn: { padding: 10, backgroundColor: Theme.Colors.error + '10', borderRadius: 12 },

    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyIconBox: { width: 80, height: 80, borderRadius: 30, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 24, ...Theme.Shadows.soft },
    emptyAddBtn: { marginTop: 32, minWidth: 200 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    modalContent: { maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    searchList: { marginTop: 8 },
    searchResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
});
