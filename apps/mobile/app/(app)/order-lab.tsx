import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';
import { searchApi } from '@/services/search.api';
import { clinicalOrderApi, ClinicalOrderType } from '@/services/clinical-order.api';
import { useDebounce } from '@/utils/useDebounce';

export default function OrderLabScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { appointmentId, type } = useLocalSearchParams<{ appointmentId: string; type: string }>();

    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);
    const [labs, setLabs] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedLab, setSelectedLab] = useState<any | null>(null);
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    React.useEffect(() => {
        searchLabs();
    }, [debouncedQuery]);

    const searchLabs = async () => {
        if (!debouncedQuery) return;
        setSearching(true);
        try {
            const res = await searchApi.searchLabs(debouncedQuery);
            if (res.success) {
                setLabs(res.data || []);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setSearching(false);
        }
    };

    const handleSendOrder = async () => {
        if (!selectedLab) {
            Alert.alert('Selection Required', 'Please select a lab center.');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Details Required', 'Please enter test details.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await clinicalOrderApi.createOrder({
                appointmentId,
                type: type as ClinicalOrderType || ClinicalOrderType.LAB,
                description: description.trim(),
                metadata: {
                    labCenterId: selectedLab.id,
                    labName: selectedLab.name
                }
            });

            if (res.data) {
                Alert.alert('Success', 'Order sent successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send order');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Theme.Colors.text} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">{type === 'IMAGING' ? 'Order Imaging' : 'Order Lab Test'}</AppText>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <AppText variant="caption" color="textSecondary" weight="bold" uppercase style={{marginBottom: 8}}>SELECT CENTER</AppText>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color={Theme.Colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for labs/radiology..."
                        value={query}
                        onChangeText={setQuery}
                    />
                    {searching && <ActivityIndicator size="small" color={Theme.Colors.primary} />}
                </View>

                {selectedLab ? (
                    <AppCard padding="md" style={styles.selectedCard}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                            <View>
                                <AppText weight="bold" color="primary">{selectedLab.name}</AppText>
                                <AppText variant="caption" color="textSecondary">{selectedLab.address}, {selectedLab.city}</AppText>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedLab(null)}>
                                <Ionicons name="close-circle" size={24} color={Theme.Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </AppCard>
                ) : (
                    <FlatList
                        data={labs}
                        keyExtractor={item => item.id}
                        style={{ maxHeight: 200, marginBottom: 20 }}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.labItem} onPress={() => setSelectedLab(item)}>
                                <AppText weight="bold">{item.name}</AppText>
                                <AppText variant="caption" color="textSecondary">{item.city}</AppText>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={query ? <AppText style={{padding: 10}} color="textSecondary">No labs found</AppText> : null}
                    />
                )}

                <AppText variant="caption" color="textSecondary" weight="bold" uppercase style={{marginTop: 20, marginBottom: 8}}>ORDER DETAILS</AppText>
                <TextInput
                    style={styles.textArea}
                    placeholder="Enter tests to perform (e.g. CBC, Lipid Profile)..."
                    multiline
                    textAlignVertical="top"
                    value={description}
                    onChangeText={setDescription}
                />

                <AppButton
                    title="SEND ORDER"
                    onPress={handleSendOrder}
                    disabled={submitting}
                    loading={submitting}
                    style={{marginTop: 24}}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    backBtn: { padding: 8 },
    content: { padding: 24 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, borderRadius: 12, paddingHorizontal: 12, height: 48, marginBottom: 12 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: Theme.Colors.text },
    labItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface },
    selectedCard: { borderColor: Theme.Colors.primary, borderWidth: 1, marginBottom: 20 },
    textArea: { backgroundColor: Theme.Colors.surface, borderWidth: 1, borderColor: Theme.Colors.divider, borderRadius: 12, padding: 16, height: 120, fontSize: 16, color: Theme.Colors.text },
});
