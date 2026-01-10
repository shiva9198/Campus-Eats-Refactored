import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Image,
    Switch
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { menuService } from '../../../services/menuService';
import { storage, BUCKET_ID } from '../../../services/appwrite';
import { theme } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import BrandingHeader from '../../../components/common/BrandingHeader';
import Card from '../../../components/common/Card';

const AdminMenuListScreen = ({ navigation }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchItems = async () => {
        try {
            const response = await menuService.getMenuItems();
            setItems(response.documents);
        } catch (error) {
            console.error('Error fetching menu items:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchItems();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchItems();
    };

    const handleBulkUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'],
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            setUploading(true);
            const { uri } = result.assets[0];

            // Read file
            const response = await fetch(uri);
            const blob = await response.blob();
            const reader = new FileReader();

            reader.onload = async (e) => {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                if (jsonData.length === 0) {
                    Alert.alert('Error', 'File is empty or invalid format');
                    setUploading(false);
                    return;
                }

                // Upload Items
                let successCount = 0;
                let failCount = 0;

                for (const row of jsonData) {
                    try {
                        // Expected columns: Name, Price, Category, Available
                        if (!row.Name || !row.Price) continue;

                        await menuService.createMenuItem({
                            name: row.Name,
                            price: parseFloat(row.Price),
                            category: row.Category || 'Fast Food',
                            available: row.Available !== undefined ? parseInt(row.Available) : 100,
                            sectionClosed: false,
                            imageUrl: null // Default no image for bulk
                        });
                        successCount++;
                    } catch (err) {
                        console.error("Row fail", err);
                        failCount++;
                    }
                }

                setUploading(false);
                Alert.alert(
                    'Upload Complete',
                    `Successfully added: ${successCount}\nFailed: ${failCount}`,
                    [{ text: 'OK', onPress: onRefresh }]
                );
            };

            reader.readAsBinaryString(blob);

        } catch (error) {
            console.error('Bulk upload error:', error);
            Alert.alert('Error', 'Failed to upload/parse file');
            setUploading(false);
        }
    };

    const toggleAvailability = async (item) => {
        const newStock = item.available > 0 ? 0 : 50;
        setItems(prev => prev.map(i => i.$id === item.$id ? { ...i, available: newStock } : i));

        try {
            await databases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.MENU_ITEMS,
                item.$id,
                { available: newStock }
            );
        } catch (error) {
            Alert.alert("Error", "Failed to update status");
            setRefreshing(true);
        }
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.imageContainer}>
                {item.imageUrl ? (
                    <Image
                        source={{ uri: storage.getFileView(BUCKET_ID, item.imageUrl).href }}
                        style={styles.image}
                    />
                ) : (
                    <View style={[styles.image, styles.placeholder]}>
                        <Ionicons name="fast-food" size={24} color={theme.colors.textSecondary} />
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
            </View>

            <View style={styles.actions}>
                <Switch
                    value={item.available > 0}
                    onValueChange={() => toggleAvailability(item)}
                    trackColor={{ false: theme.colors.border, true: theme.colors.success }}
                    thumbColor={'#fff'}
                />
                <TouchableOpacity onPress={() => navigation.navigate('AdminEditMenu', { item })}>
                    <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>
        </Card>
    );

    const HeaderActions = () => (
        <View style={styles.headerActions}>
            <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handleBulkUpload}
                disabled={uploading}
            >
                {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('AdminEditMenu')}
            >
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader
                    title="Menu Management"
                    showMenu={true}
                    rightAction={<HeaderActions />}
                />
            </SafeAreaView>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={item => item.$id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No items found</Text>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 10
    },
    addBtn: {
        backgroundColor: theme.colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.small,
    },
    uploadBtn: {
        backgroundColor: theme.colors.textSecondary,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        padding: theme.spacing.m,
        paddingBottom: 80, // Extra padding for FAB usually, but here just safe spacing
    },
    card: {
        flexDirection: 'row',
        padding: theme.spacing.s,
        marginBottom: theme.spacing.m,
        alignItems: 'center',
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 12,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center'
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    category: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    actions: {
        alignItems: 'center',
        gap: 10,
        paddingLeft: 10
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: theme.colors.textSecondary
    }
});

export default AdminMenuListScreen;
