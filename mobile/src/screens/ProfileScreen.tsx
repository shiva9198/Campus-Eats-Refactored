import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { parseJwt } from '../utils/jwt';
import { AppHeader } from '../components/AppHeader';

interface ProfileScreenProps {
    onBack: () => void;
}

const ProfileScreen = ({ onBack }: ProfileScreenProps) => {
    const { token, signOut, userRole } = useAuth();

    const userInfo = token ? parseJwt(token) : null;
    const username = userInfo?.sub || 'User';

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader
                title="Profile"
                showBack
                onBack={onBack}
            />

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>Username</Text>
                    <Text style={styles.value}>{username}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>Role</Text>
                    <Text style={styles.value}>{userRole || 'Student'}</Text>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    backText: { fontSize: 16, color: '#FF4B3A' },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    card: {
        backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    label: { fontSize: 14, color: '#666', marginBottom: 4 },
    value: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
    logoutButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FF4B3A', borderRadius: 12, padding: 16, alignItems: 'center' },
    logoutText: { color: '#FF4B3A', fontSize: 16, fontWeight: 'bold' },
});

export default ProfileScreen;
