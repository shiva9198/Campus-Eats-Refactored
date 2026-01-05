import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { account } from '../../services/appwrite';
import BrandingHeader from '../../components/common/BrandingHeader';
import Card from '../../components/common/Card';
import GlowButton from '../../components/common/GlowButton';

const EditProfileScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setLoading(true);
        try {
            await account.updateName(name);
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Update Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader showBack={true} onBackPress={() => navigation.goBack()} title="Edit Profile" />
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>
                    <Card style={styles.formCard}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your full name"
                            placeholderTextColor={theme.colors.textSecondary}
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={user?.email}
                            editable={false}
                        />
                        <Text style={styles.caption}>Email cannot be changed.</Text>
                    </Card>

                    <GlowButton
                        title="Save Changes"
                        onPress={handleUpdate}
                        loading={loading}
                        style={styles.saveButton}
                        variant="primary"
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        padding: theme.spacing.m,
    },
    formCard: {
        backgroundColor: theme.colors.surface,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: theme.colors.inputBg,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.border,
        fontSize: 16,
        color: theme.colors.text,
    },
    disabledInput: {
        backgroundColor: theme.colors.surfaceLight,
        color: theme.colors.textSecondary,
        borderColor: theme.colors.border,
    },
    caption: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 4,
    },
    saveButton: {
        marginTop: 30,
    },
});

export default EditProfileScreen;
