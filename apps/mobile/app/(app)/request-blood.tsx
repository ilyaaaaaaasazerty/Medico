import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Theme from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppScreen, AppText, AppCard, AppButton, AppInput } from '@/components/base';

export default function RequestBloodScreen() {
    const router = useRouter();
    const [bloodType, setBloodType] = useState('O+');
    const [units, setUnits] = useState('1');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const bloodCrimson = '#E31C25';

    const handleBroadcast = () => {
        if (!location) {
            Alert.alert('Protocol Error', 'Clinical institution location is mandatory for broadcasting.');
            return;
        }
        Alert.alert(
            'Emergency Broadcast Authorized',
            'Your clinical requirement has been encrypted and dispatched to compatible donors within your medical vicinity.',
            [{ text: 'Acknowledge', onPress: () => router.back() }]
        );
    };

    return (
        <AppScreen padding={false}>
            <LinearGradient
                colors={[bloodCrimson + '12', 'transparent']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Serological Link</AppText>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <AppText variant="h2" weight="black">Emergency Request</AppText>
                    <AppText variant="body" color="textSecondary" weight="bold" style={{ marginTop: 8 }}>
                        Tactical broadcast of critical serological requirements to authorized donors via secure clinical synchronization.
                    </AppText>
                </View>

                <View style={styles.section}>
                    <AppText variant="caption" color="textSecondary" weight="black" uppercase style={styles.sectionLabel}>Required Blood Type</AppText>
                    <View style={styles.typeGrid}>
                        {bloodTypes.map(t => {
                            const isSelected = bloodType === t;
                            return (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.typeButton,
                                        isSelected && { borderColor: bloodCrimson, backgroundColor: bloodCrimson + '10' }
                                    ]}
                                    onPress={() => setBloodType(t)}
                                >
                                    <AppText variant="body" weight="black" style={{ color: isSelected ? bloodCrimson : Theme.Colors.textSecondary }}>{t}</AppText>
                                    {isSelected && <View style={[styles.selectionDot, { backgroundColor: bloodCrimson }]} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <AppCard padding="md" style={styles.inputCard}>
                    <AppInput
                        label="PROTOCOL UNITS REQUIRED"
                        value={units}
                        onChangeText={setUnits}
                        keyboardType="numeric"
                        placeholder="e.g. 2"
                    />
                    <View style={{ height: 20 }} />
                    <AppInput
                        label="MEDICAL INSTITUTION"
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Hospital Name, Room/Level"
                    />
                </AppCard>

                <View style={styles.noteBox}>
                    <AppInput
                        label="URGENCY & LOGISTICS NOTES"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        placeholder="State specific requirements (Whole blood, Platelets...)"
                        style={{ height: 120, textAlignVertical: 'top' }}
                    />
                </View>

                <View style={styles.securitySeal}>
                    <Ionicons name="shield-checkmark" size={20} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="textSecondary" weight="black">GEOSPATIAL DISTANCE PROTOCOL ACTIVE</AppText>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <AppButton
                    title="ACTIVATE DONOR LINK"
                    onPress={handleBroadcast}
                    style={{ height: 64, borderRadius: 22, backgroundColor: Theme.Colors.text }}
                    textStyle={{ color: 'white' }}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    content: { paddingHorizontal: 24, paddingBottom: 120 },
    heroSection: { marginBottom: 32 },

    section: { marginBottom: 32 },
    sectionLabel: { fontSize: 9, marginBottom: 12 },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    typeButton: { width: '22%', height: 60, borderRadius: 16, borderWidth: 1, borderColor: Theme.Colors.divider, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center' },
    selectionDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3 },

    inputCard: { borderRadius: 28 },
    noteBox: { marginTop: 24 },

    securitySeal: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32, justifyContent: 'center' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, backgroundColor: Theme.Colors.background, borderTopWidth: 1, borderTopColor: Theme.Colors.divider },
});
