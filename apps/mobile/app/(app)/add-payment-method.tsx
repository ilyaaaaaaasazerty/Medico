import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { patientApi } from '@/services/patient.api';
import { AppScreen, AppText, AppInput, AppButton } from '@/components/base';
import Theme from '@/constants/Theme';

export default function AddPaymentMethodScreen() {
    const router = useRouter();
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!cardName || !cardNumber || !expiry || !cvv) {
            Alert.alert('Incomplete Data', 'Please fill in all card details.');
            return;
        }

        setLoading(true);
        try {
            const res = await patientApi.addPaymentMethod({
                type: 'CARD',
                provider: 'VISA', // Mocking provider
                last4: cardNumber.slice(-4),
                name: cardName
            });
            if (res.success) {
                Alert.alert('Success', 'Payment method added successfully.');
                router.back();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to add payment method.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppScreen padding={false}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color={Theme.Colors.primary} />
                </TouchableOpacity>
                <AppText variant="h3" weight="black">Initialize Pathway</AppText>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <AppText variant="caption" weight="black" color="primary" style={{ letterSpacing: 1.5, marginBottom: 24 }}>CARD CREDENTIALS</AppText>

                <AppInput
                    label="HOLDER NOMENCLATURE"
                    placeholder="E.G. JOHN DOE"
                    value={cardName}
                    onChangeText={setCardName}
                />

                <AppInput
                    label="CARD IDENTIFIER (PAN)"
                    placeholder="•••• •••• •••• ••••"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    keyboardType="number-pad"
                />

                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <AppInput
                            label="EXPIRATION"
                            placeholder="MM/YY"
                            value={expiry}
                            onChangeText={setExpiry}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <AppInput
                            label="CVV"
                            placeholder="•••"
                            value={cvv}
                            onChangeText={setCvv}
                            secureTextEntry
                        />
                    </View>
                </View>

                <AppButton
                    title="SYNCHRONIZE CREDENTIALS"
                    loading={loading}
                    onPress={handleAdd}
                    style={styles.submitBtn}
                />
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    content: { padding: 24 },
    row: { flexDirection: 'row' },
    submitBtn: { marginTop: 40, height: 64, borderRadius: 24, backgroundColor: Theme.Colors.text },
});
