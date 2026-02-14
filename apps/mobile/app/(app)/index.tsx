import { useAuth } from '@/providers/AuthProvider';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#0A84FF" />
            </View>
        );
    }

    if (user?.role === 'DOCTOR') {
        return <Redirect href="/(app)/(doctor-tabs)" />;
    }

    if (user?.role === 'CLINIC_ADMIN' || user?.role === 'NURSE' || user?.role === 'RECEPTIONIST' || user?.role === 'STAFF') {
        return <Redirect href="/(app)/(clinic-tabs)" />;
    }


    // Default (Patient)
    return <Redirect href="/(app)/(tabs)" />;
}
