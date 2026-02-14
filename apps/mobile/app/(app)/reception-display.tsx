import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { appointmentApi, Appointment } from '@/services/appointment.api';
import { clinicApi } from '@/services/clinic.api';
import Theme from '@/constants/Theme';
import { doctorApi } from '@/services/doctor.api';
import { AppScreen, AppText, AppCard } from '@/components/base';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');
const isTV = width >= 1080 || height >= 1080;
const isMobile = width < 768;

export default function ReceptionDisplayScreen() {
    const router = useRouter();
    const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
    const { user } = useAuth();
    const [currentPatient, setCurrentPatient] = useState<Appointment | null>(null);
    const [upcomingQueue, setUpcomingQueue] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [emergencyMode, setEmergencyMode] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showHelp, setShowHelp] = useState(false);
    const [lastAnnouncedId, setLastAnnouncedId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const poll = setInterval(checkQueue, 5000);
        checkQueue();
        return () => {
            clearInterval(timer);
            clearInterval(poll);
        };
    }, [clinicId]);

    const announcePatient = useCallback((patient: Appointment) => {
        if (patient.id === lastAnnouncedId) return;
        const name = `${patient.patient?.firstName || ''} ${patient.patient?.lastName || ''}`.trim();
        const doctor = patient.doctor?.lastName ? `Doctor ${patient.doctor.lastName}` : 'the examination room';
        Speech.speak(`Now calling ${name}. Please proceed to ${doctor}.`, {
            language: 'en-US',
            pitch: 1.0,
            rate: 0.9
        });
        setLastAnnouncedId(patient.id);
    }, [lastAnnouncedId]);

    const checkQueue = async () => {
        try {
            let allAppointments: Appointment[] = [];

            if (user?.role === 'DOCTOR') {
                const [calledRes, waitingRes, dashRes] = await Promise.all([
                    appointmentApi.getDoctorAppointments({ status: 'CALLED' }),
                    appointmentApi.getDoctorAppointments({ status: 'CHECKED_IN' }),
                    doctorApi.getDashboard()
                ]);
                if (calledRes.success && calledRes.data) allAppointments = [...calledRes.data];
                if (waitingRes.success && waitingRes.data) allAppointments = [...allAppointments, ...waitingRes.data];
                if (dashRes.success && dashRes.data) {
                    setEmergencyMode(dashRes.data.profile.emergencyMode);
                }
            } else if (user?.role === 'CLINIC_ADMIN' && clinicId) {
                const clinicRes = await clinicApi.getPublicProfile(clinicId) as any;
                if (clinicRes.success && clinicRes.data) {
                    setEmergencyMode(clinicRes.data.emergencyMode || false);
                }
            }

            // Find called patient
            const called = allAppointments.find(a => a.status === 'CALLED');
            if (called && called.id !== currentPatient?.id) {
                setCurrentPatient(called);
                announcePatient(called);
            } else if (!called) {
                setCurrentPatient(null);
            }

            // Get waiting queue (next 5)
            const waiting = allAppointments
                .filter(a => a.status === 'CHECKED_IN')
                .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                .slice(0, 5);
            setUpcomingQueue(waiting);

        } catch (error) {
            console.error('Queue polling error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !currentPatient) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.Colors.primary} />
                <AppText variant="body" color="textSecondary" weight="bold" uppercase style={{ marginTop: 24, fontSize: isTV ? 16 : 10, letterSpacing: 2 }}>
                    Initializing Display...
                </AppText>
            </View>
        );
    }

    if (emergencyMode) {
        return (
            <AppScreen padding={false} style={{ backgroundColor: Theme.Colors.error }}>
                <View style={styles.emergencyContent}>
                    <Ionicons name="warning" size={isTV ? 200 : 120} color="white" />
                    <AppText variant="h1" weight="black" style={{ color: 'white', fontSize: isTV ? 140 : 64, marginTop: 30 }}>
                        EMERGENCY
                    </AppText>
                    <AppText variant="h2" weight="bold" style={{ color: 'white', marginTop: 20, opacity: 0.9 }}>
                        All appointments temporarily suspended
                    </AppText>
                    <AppText variant="body" style={{ color: 'white', marginTop: 40, textAlign: 'center', opacity: 0.7, maxWidth: 600 }}>
                        Please remain calm and follow staff instructions.
                    </AppText>
                </View>
            </AppScreen>
        );
    }

    return (
        <AppScreen padding={false} style={{ backgroundColor: Theme.Colors.background }}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <AppText variant="h1" weight="black" color="primary" style={{ fontSize: isTV ? 48 : 28 }}>
                        Patient Queue
                    </AppText>
                    <AppText variant="caption" color="textSecondary" weight="bold" uppercase style={{ fontSize: isTV ? 14 : 10, letterSpacing: 2, marginTop: 4 }}>
                        Reception Display
                    </AppText>
                </View>
                <View style={styles.clockBox}>
                    <AppText variant="h2" weight="black" style={{ fontSize: isTV ? 56 : 32 }}>
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </AppText>
                    <AppText variant="caption" color="textSecondary" style={{ fontSize: isTV ? 14 : 10 }}>
                        {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                    </AppText>
                </View>
                <TouchableOpacity style={styles.helpBtn} onPress={() => setShowHelp(true)}>
                    <Ionicons name="help-circle-outline" size={isTV ? 40 : 28} color={Theme.Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* NOW SERVING - Main Panel */}
                <View style={styles.mainPanel}>
                    {currentPatient ? (
                        <AppCard padding="none" style={styles.nowServingCard}>
                            <View style={styles.nowServingHeader}>
                                <AppText variant="caption" color="primary" weight="black" uppercase style={{ fontSize: isTV ? 24 : 14, letterSpacing: 4 }}>
                                    NOW SERVING
                                </AppText>
                            </View>
                            <View style={styles.patientDisplay}>
                                {currentPatient.patient?.avatarUrl && (
                                    <Image source={{ uri: currentPatient.patient.avatarUrl }} style={styles.avatar} />
                                )}
                                <AppText variant="h1" weight="black" align="center" style={{ fontSize: isTV ? 96 : 52 }}>
                                    {currentPatient.patient?.firstName} {currentPatient.patient?.lastName}
                                </AppText>
                            </View>
                            <View style={styles.directionBox}>
                                <Ionicons name="arrow-forward" size={isTV ? 48 : 28} color={Theme.Colors.primary} />
                                <AppText variant="h2" weight="bold" color="primary" style={{ fontSize: isTV ? 48 : 28, marginLeft: 16 }}>
                                    {currentPatient.doctor?.lastName ? `Dr. ${currentPatient.doctor.lastName}` : 'Room 1'}
                                </AppText>
                            </View>
                            <View style={styles.ticketNumber}>
                                <AppText variant="caption" color="textSecondary" weight="bold" style={{ fontSize: isTV ? 16 : 10 }}>Ticket</AppText>
                                <AppText variant="h1" weight="black" color="primary" style={{ fontSize: isTV ? 72 : 42 }}>
                                    #{currentPatient.id.substring(0, 4).toUpperCase()}
                                </AppText>
                            </View>
                        </AppCard>
                    ) : (
                        <AppCard padding="none" style={styles.idleCard}>
                            <View style={styles.idleContent}>
                                <View style={styles.idleIcon}>
                                    <Ionicons name="people-outline" size={isTV ? 100 : 60} color={Theme.Colors.divider} />
                                </View>
                                <AppText variant="h2" weight="bold" style={{ marginTop: 24, fontSize: isTV ? 36 : 24 }}>
                                    Ready to Serve
                                </AppText>
                                <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 12, maxWidth: 400, fontSize: isTV ? 18 : 14 }}>
                                    The next patient will be displayed here when called.
                                </AppText>
                            </View>
                        </AppCard>
                    )}
                </View>

                {/* QUEUE SIDEBAR */}
                {!isMobile && (
                    <View style={styles.sidebar}>
                        <AppText variant="caption" color="textSecondary" weight="black" uppercase style={{ fontSize: isTV ? 16 : 11, letterSpacing: 2, marginBottom: 16 }}>
                            NEXT IN LINE
                        </AppText>
                        {upcomingQueue.length > 0 ? (
                            upcomingQueue.map((apt, index) => (
                                <AppCard key={apt.id} style={styles.queueItem} padding="md">
                                    <View style={styles.queueNumber}>
                                        <AppText variant="h3" weight="black" color="primary" style={{ fontSize: isTV ? 28 : 18 }}>{index + 1}</AppText>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 16 }}>
                                        <AppText variant="body" weight="bold" style={{ fontSize: isTV ? 20 : 14 }}>
                                            {apt.patient?.firstName} {apt.patient?.lastName?.charAt(0)}.
                                        </AppText>
                                        <AppText variant="caption" color="textSecondary" style={{ fontSize: isTV ? 14 : 10 }}>
                                            {apt.scheduledTime}
                                        </AppText>
                                    </View>
                                </AppCard>
                            ))
                        ) : (
                            <View style={styles.emptyQueue}>
                                <Ionicons name="checkmark-circle-outline" size={isTV ? 48 : 32} color={Theme.Colors.success} />
                                <AppText variant="body" color="textSecondary" align="center" style={{ marginTop: 12, fontSize: isTV ? 16 : 12 }}>
                                    No patients waiting
                                </AppText>
                            </View>
                        )}

                        {/* Stats */}
                        <View style={styles.statsBox}>
                            <View style={styles.statItem}>
                                <AppText variant="h2" weight="black" color="primary" style={{ fontSize: isTV ? 42 : 28 }}>
                                    {upcomingQueue.length}
                                </AppText>
                                <AppText variant="caption" color="textSecondary" style={{ fontSize: isTV ? 12 : 9 }}>Waiting</AppText>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <AppText variant="h2" weight="black" color="success" style={{ fontSize: isTV ? 42 : 28 }}>
                                    ~{upcomingQueue.length * 15}
                                </AppText>
                                <AppText variant="caption" color="textSecondary" style={{ fontSize: isTV ? 12 : 9 }}>Est. Wait (min)</AppText>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerLine} />
                <View style={styles.footerBranding}>
                    <Ionicons name="medical" size={isTV ? 20 : 14} color={Theme.Colors.primary} />
                    <AppText variant="caption" color="textSecondary" weight="bold" uppercase style={{ fontSize: isTV ? 12 : 8, letterSpacing: 1, marginLeft: 8 }}>
                        Medico Health System
                    </AppText>
                </View>
            </View>

            {/* Help Modal */}
            {showHelp && (
                <TouchableOpacity style={styles.helpOverlay} activeOpacity={1} onPress={() => setShowHelp(false)}>
                    <AppCard style={styles.helpModal} padding="lg">
                        <AppText variant="h2" weight="black">Connect to TV</AppText>
                        <AppText variant="body" color="textSecondary" style={{ marginTop: 16, lineHeight: 24 }}>
                            To display this on a TV:
                        </AppText>
                        <View style={styles.helpStep}>
                            <View style={styles.stepNumber}><AppText variant="body" weight="bold" style={{ color: 'white' }}>1</AppText></View>
                            <AppText variant="body" style={{ flex: 1, marginLeft: 12 }}>Connect a device (laptop, tablet, or streaming stick) to your TV via HDMI</AppText>
                        </View>
                        <View style={styles.helpStep}>
                            <View style={styles.stepNumber}><AppText variant="body" weight="bold" style={{ color: 'white' }}>2</AppText></View>
                            <AppText variant="body" style={{ flex: 1, marginLeft: 12 }}>Open the web browser and navigate to the Medico dashboard</AppText>
                        </View>
                        <View style={styles.helpStep}>
                            <View style={styles.stepNumber}><AppText variant="body" weight="bold" style={{ color: 'white' }}>3</AppText></View>
                            <AppText variant="body" style={{ flex: 1, marginLeft: 12 }}>Go to "Public Display" from the clinic settings</AppText>
                        </View>
                        <View style={styles.helpStep}>
                            <View style={styles.stepNumber}><AppText variant="body" weight="bold" style={{ color: 'white' }}>4</AppText></View>
                            <AppText variant="body" style={{ flex: 1, marginLeft: 12 }}>For wireless: Use screen mirroring (AirPlay, Chromecast, or Miracast)</AppText>
                        </View>
                        <TouchableOpacity style={styles.closeHelpBtn} onPress={() => setShowHelp(false)}>
                            <AppText variant="body" weight="bold" style={{ color: 'white' }}>Got it</AppText>
                        </TouchableOpacity>
                    </AppCard>
                </TouchableOpacity>
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: isTV ? 48 : 24, backgroundColor: Theme.Colors.surface, borderBottomWidth: 1, borderBottomColor: Theme.Colors.divider },
    clockBox: { alignItems: 'flex-end', marginRight: isTV ? 24 : 12 },
    helpBtn: { padding: 8 },

    content: { flex: 1, flexDirection: 'row', padding: isTV ? 48 : 24, gap: isTV ? 48 : 24 },
    mainPanel: { flex: 2 },
    sidebar: { flex: 1, maxWidth: isTV ? 400 : 280 },

    nowServingCard: { flex: 1, borderRadius: isTV ? 48 : 24, backgroundColor: Theme.Colors.surface, borderWidth: 2, borderColor: Theme.Colors.primary + '30', justifyContent: 'center', alignItems: 'center', ...Theme.Shadows.floating },
    nowServingHeader: { position: 'absolute', top: isTV ? 48 : 24, alignItems: 'center' },
    patientDisplay: { alignItems: 'center', gap: isTV ? 32 : 16 },
    avatar: { width: isTV ? 180 : 100, height: isTV ? 180 : 100, borderRadius: isTV ? 90 : 50, borderWidth: 4, borderColor: Theme.Colors.primary },
    directionBox: { flexDirection: 'row', alignItems: 'center', marginTop: isTV ? 48 : 24, backgroundColor: Theme.Colors.primary + '10', paddingVertical: isTV ? 20 : 12, paddingHorizontal: isTV ? 40 : 24, borderRadius: isTV ? 20 : 12 },
    ticketNumber: { position: 'absolute', bottom: isTV ? 48 : 24, alignItems: 'center' },

    idleCard: { flex: 1, borderRadius: isTV ? 48 : 24, backgroundColor: Theme.Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },
    idleContent: { alignItems: 'center', padding: isTV ? 60 : 40 },
    idleIcon: { width: isTV ? 180 : 120, height: isTV ? 180 : 120, borderRadius: isTV ? 60 : 40, backgroundColor: Theme.Colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Theme.Colors.divider },

    queueItem: { flexDirection: 'row', alignItems: 'center', marginBottom: isTV ? 16 : 10, borderWidth: 1, borderColor: Theme.Colors.divider },
    queueNumber: { width: isTV ? 56 : 40, height: isTV ? 56 : 40, borderRadius: isTV ? 16 : 12, backgroundColor: Theme.Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
    emptyQueue: { alignItems: 'center', paddingVertical: isTV ? 60 : 40 },

    statsBox: { marginTop: 'auto', flexDirection: 'row', backgroundColor: Theme.Colors.surface, borderRadius: isTV ? 24 : 16, padding: isTV ? 24 : 16, borderWidth: 1, borderColor: Theme.Colors.divider },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: Theme.Colors.divider, marginHorizontal: 16 },

    footer: { padding: isTV ? 32 : 20, alignItems: 'center' },
    footerLine: { width: 100, height: 1, backgroundColor: Theme.Colors.divider, marginBottom: 12 },
    footerBranding: { flexDirection: 'row', alignItems: 'center' },

    emergencyContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },

    helpOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    helpModal: { maxWidth: 500, width: '100%' },
    helpStep: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
    stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: Theme.Colors.primary, justifyContent: 'center', alignItems: 'center' },
    closeHelpBtn: { backgroundColor: Theme.Colors.primary, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
});
