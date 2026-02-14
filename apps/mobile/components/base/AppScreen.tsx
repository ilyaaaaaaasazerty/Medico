import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    StatusBar,
    ViewStyle,
    RefreshControlProps,
    StyleProp
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from '@/constants/Theme';

interface AppScreenProps {
    children: React.ReactNode;
    scrollable?: boolean;
    padding?: boolean;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    safeArea?: boolean;
    refreshControl?: React.ReactElement<RefreshControlProps>;
    center?: boolean;
}


export const AppScreen: React.FC<AppScreenProps> = ({
    children,
    scrollable = true,
    padding = true,
    style,
    contentContainerStyle,
    safeArea = true,
    refreshControl,
    center = false,
}) => {

    const content = (
        <View style={[
            styles.content,
            padding && { paddingHorizontal: Theme.Layout.screenPadding },
            center && { justifyContent: 'center', alignItems: 'center' },
            contentContainerStyle
        ]}>

            {children}
        </View>
    );

    const Container = safeArea ? SafeAreaView : View;

    return (
        <Container style={[styles.container, style]}>
            <StatusBar barStyle="dark-content" />
            {scrollable ? (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={refreshControl}
                    keyboardShouldPersistTaps="handled"
                >
                    {content}
                </ScrollView>
            ) : (
                content
            )}
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingBottom: 20,
    },
});
