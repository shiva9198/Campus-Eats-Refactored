import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../../constants/theme';
import { databases, STORAGE_ID, DATABASE_ID, COLLECTIONS, BUCKET_ID, storage } from '../../../services/appwrite';
import { ID } from 'react-native-appwrite';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import BrandingHeader from '../../../components/common/BrandingHeader';
import Card from '../../../components/common/Card';
import GlowButton from '../../../components/common/GlowButton';

const AdminEditMenuScreen = ({ navigation, route }) => {
    const isEditing = !!route.params?.item;
    const existingItem = route.params?.item || {};

    const [name, setName] = useState(existingItem.name || '');
    const [price, setPrice] = useState(existingItem.price ? existingItem.price.toString() : '');
    const [category, setCategory] = useState(existingItem.category || 'Fast Food');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const existingImageUrl = existingItem.imageUrl
        ? storage.getFileView(BUCKET_ID, existingItem.imageUrl).href
        : null;

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name || !price || !category) {
            Alert.alert("Error", "Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            let imageId = existingItem.imageUrl;

            if (image) {
                const fileUpload = await storage.createFile(
                    BUCKET_ID,
                    ID.unique(),
                    {
                        name: `menu_${Date.now()}.jpg`,
                        type: 'image/jpeg',
                        uri: image,
                    }
                );
                imageId = fileUpload.$id;
            }

            const payload = {
                name,
                price: parseFloat(price),
                category,
                imageUrl: imageId,
                available: isEditing ? existingItem.available : 100,
                sectionClosed: false
            };

            if (isEditing) {
                await databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.MENU_ITEMS,
                    existingItem.$id,
                    payload
                );
                Alert.alert("Success", "Item updated!");
            } else {
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTIONS.MENU_ITEMS,
                    ID.unique(),
                    payload
                );
                Alert.alert("Success", "Item created!");
            }
            navigation.goBack();

        } catch (error) {
            console.error(error);
            Alert.alert("Error", error.message || "Failed to save item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader
                    title={isEditing ? 'Edit Item' : 'Add New Item'}
                    showBack={true}
                    onBackPress={() => navigation.goBack()}
                />
            </SafeAreaView>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>

                    <Card style={styles.formCard}>
                        {/* Image Picker */}
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.previewImage} />
                            ) : existingImageUrl ? (
                                <Image source={{ uri: existingImageUrl }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.placeholder}>
                                    <Ionicons name="camera-outline" size={40} color={theme.colors.textSecondary} />
                                    <Text style={styles.placeholderText}>Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Fields */}
                        <Text style={styles.label}>Item Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Chicken Burger"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Price (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 150"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={price}
                            onChangeText={setPrice}
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Category</Text>
                        <View style={styles.categoryRow}>
                            {['Fast Food', 'Meals', 'Drinks', 'Dessert'].map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.catChip, category === cat && styles.activeCat]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text style={[styles.catText, category === cat && styles.activeCatText]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Card>

                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <GlowButton
                    title="Save Item"
                    onPress={handleSave}
                    loading={loading}
                    variant="primary"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.m,
    },
    formCard: {
        backgroundColor: theme.colors.surface,
    },
    imagePicker: {
        width: '100%',
        height: 200,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.m,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center'
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: theme.colors.textSecondary,
        marginTop: 10
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: theme.colors.text,
        marginTop: 10,
    },
    input: {
        backgroundColor: theme.colors.inputBg,
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
        color: theme.colors.text
    },
    categoryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
        marginBottom: 20
    },
    catChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: theme.colors.surfaceLight,
        borderWidth: 1,
        borderColor: theme.colors.border
    },
    activeCat: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary
    },
    catText: {
        color: theme.colors.text,
    },
    activeCatText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    footer: {
        padding: theme.spacing.m,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
});

export default AdminEditMenuScreen;
