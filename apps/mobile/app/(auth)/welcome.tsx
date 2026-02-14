import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Theme from '@/constants/Theme';
import { AppScreen, AppText, AppButton } from '@/components/base';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
    return (
        <AppScreen padding={false} scrollable={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.logoBadge}>
                        <Ionicons name="medical" size={40} color={Theme.Colors.secondary} />
                    </View>
                    <View style={styles.glow} />
                </View>

                <View style={styles.content}>
                    <AppText variant="hero" color="primary" style={styles.title}>Medico</AppText>
                    <AppText variant="h3" color="textSecondary" style={styles.subtitle}>
                        Your health, simplified
                    </AppText>

                    <View style={styles.features}>
                        <FeatureItem text="Book appointments instantly" />
                        <FeatureItem text="Access your medical records" />
                        <FeatureItem text="Connect with top doctors" />
                        <FeatureItem text="Manage your family's health" />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Link href="/(auth)/register" asChild>
                        <AppButton
                            title="Create Account"
                            size="lg"
                            style={{ marginBottom: Theme.Spacing.md }}
                        />
                    </Link>

                    <Link href="/(auth)/login" asChild>
                        <AppButton
                            title="Sign In"
                            variant="outline"
                            size="lg"
                        />
                    </Link>

                    <Link href="/(auth)/register-transport" asChild>
                        <TouchableOpacity style={{ marginTop: 24, alignItems: 'center' }}>
                            <AppText variant="caption" color="primary" weight="bold" uppercase>Join as Transport Provider</AppText>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </AppScreen>
    );
}

function FeatureItem({ text }: { text: string }) {
    return (
        <View style={styles.featureItem}>
            <View style={styles.checkIcon}>
                <Ionicons name="checkmark-circle" size={24} color={Theme.Colors.secondary} />
            </View>
            <AppText variant="body" color="text">{text}</AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Theme.Spacing.lg,
        paddingBottom: Theme.Spacing.xxl,
    },
    header: {
        height: '35%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoBadge: {
        width: 100,
        height: 100,
        borderRadius: Theme.Radii.card,
        backgroundColor: Theme.Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.Shadows.card,
        zIndex: 2,
    },
    glow: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Theme.Colors.secondary,
        opacity: 0.1,
        zIndex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        marginBottom: Theme.Spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        marginBottom: Theme.Spacing.xl,
        textAlign: 'center',
    },
    features: {
        width: '100%',
        marginTop: Theme.Spacing.lg,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.Spacing.md,
        paddingLeft: Theme.Spacing.sm,
    },
    checkIcon: {
        marginRight: Theme.Spacing.md,
    },
    footer: {
        width: '100%',
    },
});
