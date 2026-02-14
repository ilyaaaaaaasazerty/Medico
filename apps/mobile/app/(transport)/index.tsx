import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import DriverDashboardScreen from '@/components/transport/DriverDashboardScreen';
import PatientTransportScreen from '@/components/transport/PatientTransportScreen';
import { View, ActivityIndicator } from 'react-native';
import Theme from '@/constants/Theme';

export default function TransportIndex() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
            </View>
        );
    }

    if (user?.role === 'TRANSPORT_PROVIDER') {
        return <DriverDashboardScreen />;
    }

    return <PatientTransportScreen />;
}