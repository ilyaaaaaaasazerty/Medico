import { View, StyleSheet, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppCard, AppButton } from '@/components/base';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/welcome');
    };

    const MenuItem = ({ icon, label, sublabel, onPress, iconBg = Theme.Colors.primary + '10', iconColor = Theme.Colors.primary }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View style={styles.menuText}>
                <AppText variant="body" weight="black">{label}</AppText>
                {sublabel && <AppText variant="caption" color="textSecondary" weight="bold">{sublabel}</AppText>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Theme.Colors.divider} />
        </TouchableOpacity>
    );

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <AppText variant="h2" weight="black">Patient Ledger</AppText>
                <TouchableOpacity
                    style={styles.settingsBtn}
                    onPress={() => router.push('/(app)/change-password')}
                >
                    <Ionicons name="shield-checkmark-outline" size={22} color={Theme.Colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Identity Card */}
                <AppCard style={styles.identityCard} padding="none">
                    <LinearGradient
                        colors={[Theme.Colors.primary + '15', Theme.Colors.surface]}
                        style={styles.identityGradient}
                    >
                        <View style={styles.idRow}>
                            <View style={styles.avatarWrapper}>
                                <View style={styles.avatarPlaceholder}>
                                    <AppText variant="h1" weight="black" color="primary">
                                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    </AppText>
                                </View>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color={Theme.Colors.success} />
                                </View>
                            </View>
                            <View style={styles.idText}>
                                <AppText variant="h3" weight="black">{user?.firstName} {user?.lastName}</AppText>
                                <AppText variant="caption" color="textSecondary" weight="bold" uppercase>{user?.phone || 'Electronic ID Not Set'}</AppText>
                                <TouchableOpacity
                                    style={styles.editBtn}
                                    onPress={() => router.push('/(app)/edit-profile')}
                                >
                                    <AppText variant="caption" color="primary" weight="black" uppercase>Modify Identity</AppText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </AppCard>

                {/* Identity Stats */}
                <View style={styles.section}>
                    <View style={styles.assetGrid}>
                        <AppCard style={styles.assetCard} padding="md">
                            <AppText variant="caption" color="textSecondary" weight="black">CONSULTATIONS</AppText>
                            <AppText variant="h3" weight="black" color="primary">24 <AppText variant="caption" weight="black">TOTAL</AppText></AppText>
                        </AppCard>
                        <AppCard style={styles.assetCard} padding="md">
                            <AppText variant="caption" color="textSecondary" weight="black">RECORDS</AppText>
                            <AppText variant="h3" weight="black" color="primary">14 <AppText variant="caption" weight="black">DOCS</AppText></AppText>
                        </AppCard>
                    </View>
                </View>

                {/* Governance Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Household Governance</AppText>
                    <AppCard padding="none">
                        <MenuItem
                            icon="people"
                            label="Family Circle"
                            sublabel="Manage dependents and clinical records"
                            onPress={() => router.push('/(app)/family-members')}
                        />
                        <View style={styles.divider} />
                        <MenuItem
                            icon="water"
                            label="Donor Protocol"
                            sublabel="Enroll in blood donation network"
                            iconColor={Theme.Colors.error}
                            iconBg={Theme.Colors.error + '10'}
                            onPress={() => router.push('/(app)/blood-donation-settings')}
                        />
                    </AppCard>
                </View>

                {/* Administrative Section */}
                <View style={styles.section}>
                    <AppText variant="caption" color="primary" weight="black" uppercase style={styles.sectionTitle}>Administrative Terminal</AppText>
                    <AppCard padding="none">
                        <MenuItem
                            icon="notifications"
                            label="Alert Protocols"
                            sublabel="System and clinical notification gates"
                            onPress={() => router.push('/(app)/notifications')}
                        />
                        <View style={styles.divider} />
                        <MenuItem
                            icon="help-buoy"
                            label="Diagnostic Support"
                            sublabel="Access technical assistance"
                            onPress={() => { }}
                        />
                    </AppCard>
                </View>

                <AppButton
                    title="Terminate Session"
                    variant="tonal"
                    onPress={handleLogout}
                    style={styles.logoutBtn}
                    textStyle={{ color: Theme.Colors.error }}
                />

                <View style={{ height: 120 }} />
            </ScrollView>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    settingsBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Theme.Colors.primary + '08', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '15' },

    scrollContent: { paddingHorizontal: 24 },
    identityCard: { marginBottom: 32, borderRadius: 32, overflow: 'hidden' },
    identityGradient: { padding: 24 },
    idRow: { flexDirection: 'row', alignItems: 'center' },
    avatarWrapper: { position: 'relative' },
    avatarPlaceholder: { width: 80, height: 80, borderRadius: 28, backgroundColor: Theme.Colors.primary + '10', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.primary + '20' },
    verifiedBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: 'white', borderRadius: 12 },
    idText: { flex: 1, marginLeft: 20 },
    editBtn: { marginTop: 8 },

    section: { marginBottom: 32 },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },

    assetGrid: { flexDirection: 'row', gap: 16 },
    assetCard: { flex: 1, backgroundColor: Theme.Colors.surface },

    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    menuText: { flex: 1, marginLeft: 16 },
    divider: { height: 1, backgroundColor: Theme.Colors.divider, marginHorizontal: 18 },

    logoutBtn: { backgroundColor: Theme.Colors.error + '10', height: 60, borderRadius: 20 },
});
