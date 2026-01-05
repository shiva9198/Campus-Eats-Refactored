import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { databases, DATABASE_ID, COLLECTIONS } from '../../../services/appwrite';
import { Query } from 'react-native-appwrite';
import { theme } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandingHeader from '../../../components/common/BrandingHeader';
import Card from '../../../components/common/Card';

const AdminSessionControlScreen = ({ navigation }) => {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toggling, setToggling] = useState(null);

    const fetchSections = async () => {
        try {
            // Fetch all menu items to group them
            // In a real large app, you'd have a 'Categories' collection.
            // Here, we derive it from items as per web logic.
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.MENU_ITEMS,
                [Query.limit(100)]
            );

            const items = response.documents;
            const grouped = {};

            items.forEach(item => {
                const cat = item.category; // Case sensitive? Web says normalized to lower.
                // Let's keep display name as first found.
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(item);
            });

            // Status: Closed if ALL items are sectionClosed=true
            const sectionList = Object.entries(grouped).map(([category, catItems]) => ({
                category,
                isClosed: catItems.every(i => i.sectionClosed),
                itemIds: catItems.map(i => i.$id),
                displayCount: catItems.length
            }));

            setSections(sectionList);
        } catch (error) {
            console.error('Error fetching sections:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSections();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchSections();
    };

    const toggleSection = async (section) => {
        if (toggling) return;
        setToggling(section.category);

        const newStatus = !section.isClosed; // If closed, open it (false). If open, close it (true).

        // Optimistic UI
        setSections(prev => prev.map(s =>
            s.category === section.category ? { ...s, isClosed: newStatus } : s
        ));

        try {
            // We must update ALL items in this category
            // Appwrite doesn't support updateMany yet. Loop it.
            const updates = section.itemIds.map(id =>
                databases.updateDocument(
                    DATABASE_ID,
                    COLLECTIONS.MENU_ITEMS,
                    id,
                    { sectionClosed: newStatus }
                )
            );

            await Promise.all(updates);

            Alert.alert("Success", `Section ${newStatus ? 'Closed' : 'Opened'}`);

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update section");
            // Revert
            setSections(prev => prev.map(s =>
                s.category === section.category ? { ...s, isClosed: !newStatus } : s
            ));
        } finally {
            setToggling(null);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
                <BrandingHeader
                    showMenu={true}
                    title="Session Control"
                />
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            >
                <Text style={styles.explainer}>
                    Toggle sections to Open or Close them for the day. Closed sections won't accept orders.
                </Text>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
                ) : (
                    sections.map(section => (
                        <Card key={section.category} style={styles.card}>
                            <View>
                                <Text style={styles.sectionName}>{section.category}</Text>
                                <Text style={styles.sectionDetail}>{section.displayCount} Items</Text>
                            </View>

                            <View style={styles.action}>
                                <Text style={[
                                    styles.statusText,
                                    { color: section.isClosed ? theme.colors.error : theme.colors.success }
                                ]}>
                                    {section.isClosed ? 'CLOSED' : 'OPEN'}
                                </Text>
                                <Switch
                                    value={!section.isClosed} // Switch ON = Open
                                    onValueChange={() => toggleSection(section)}
                                    trackColor={{ false: theme.colors.error, true: theme.colors.success }}
                                    thumbColor={'#fff'}
                                    disabled={toggling === section.category}
                                />
                            </View>
                        </Card>
                    ))
                )}
            </ScrollView>
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
    explainer: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 20,
        textAlign: 'center'
    },
    card: {
        flexDirection: 'row',
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4
    },
    sectionDetail: {
        fontSize: 12,
        color: theme.colors.textSecondary
    },
    action: {
        alignItems: 'flex-end',
        gap: 8
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 12
    }
});

export default AdminSessionControlScreen;
