import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { adminService } from '../../services/adminService';

const AdminEditMenuScreen = ({ item, onBack, onSave }: any) => {
    const isEditing = !!item;
    const [name, setName] = useState(item?.name || '');
    const [price, setPrice] = useState(item?.price?.toString() || '');
    const [category, setCategory] = useState(item?.category || 'Main Course');
    const [description, setDescription] = useState(item?.description || '');
    const [isVegetarian, setIsVegetarian] = useState(item?.is_vegetarian ?? true);
    const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name || !price || !category) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }

        setLoading(true);
        try {
            // Image upload skipped for now (requires react-native-image-picker)
            const itemData = {
                name,
                price: Number(price),
                category,
                description,
                is_vegetarian: isVegetarian,
                is_available: isAvailable,
                image_url: null, // or empty string
            };

            if (isEditing) {
                await adminService.updateMenuItem(item.id, itemData);
                Alert.alert('Success', 'Item updated successfully');
            } else {
                await adminService.addMenuItem(itemData);
                Alert.alert('Success', 'Item added successfully');
            }
            onSave(); // Go back and refresh
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack}>
                    <Text style={styles.backText}>← Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{isEditing ? 'Edit Item' : 'Add New Item'}</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color="#007AFF" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Name *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Item Name" />

                <Text style={styles.label}>Price (₹) *</Text>
                <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="99" keyboardType="numeric" />

                <Text style={styles.label}>Category *</Text>
                <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Snacks, Drinks" />

                <Text style={styles.label}>Description</Text>
                <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Item description..." multiline numberOfLines={3} />

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Vegetarian?</Text>
                    <Switch value={isVegetarian} onValueChange={setIsVegetarian} trackColor={{ false: '#767577', true: '#4CAF50' }} />
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Available?</Text>
                    <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: '#767577', true: '#FF4B3A' }} />
                </View>

                <Text style={styles.note}>Note: Image upload not available in this version.</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    backText: { fontSize: 16, color: '#FF4B3A' },
    title: { fontSize: 18, fontWeight: 'bold' },
    saveText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
    form: { padding: 20 },
    label: { fontWeight: 'bold', marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
    textArea: { height: 80, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    switchLabel: { fontSize: 16 },
    note: { color: '#888', marginTop: 20, fontStyle: 'italic', textAlign: 'center' },
});

export default AdminEditMenuScreen;
