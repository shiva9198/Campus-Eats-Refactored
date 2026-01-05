import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Image, TouchableOpacity, Linking, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { databases, DATABASE_ID, COLLECTIONS, client } from '../../services/appwrite';
import { Query } from 'react-native-appwrite';

import { scale, vScale, mScale, normalize, SCREEN_WIDTH } from '../../utils/responsive';

const CARD_WIDTH = SCREEN_WIDTH - 60; // Leave 60px for peek/padding
const CARD_HEIGHT = vScale(180);

const OffersCarousel = () => {
    const [offers, setOffers] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [logoUrl, setLogoUrl] = useState(null);
    const flatListRef = useRef(null);

    // Fetch logo and offers
    const fetchData = async () => {
        try {
            // Fetch logo
            const settingsResponse = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.SETTINGS,
                [Query.limit(1)]
            );
            if (settingsResponse.documents.length > 0 && settingsResponse.documents[0].logoUrl) {
                setLogoUrl(settingsResponse.documents[0].logoUrl);
            }

            // Fetch offers
            const offersResponse = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.OFFERS,
                [Query.limit(5)]
            );

            if (offersResponse.documents.length > 0) {
                setOffers(offersResponse.documents);
            } else {
                // No ads - show 2 slides: Campus Eats + College branding
                setOffers([
                    {
                        $id: 'campus_eats_default_1',
                        title: "Campus Eats",
                        subtitle: "Your campus food delivery app",
                        color: theme.colors.primary,
                        showLogo: true,
                        useCampusEatsLogo: true
                    },
                    {
                        $id: 'college_default_2',
                        title: "Welcome",
                        subtitle: "Order from your favorite campus restaurants",
                        color: '#1E1E1E',
                        showLogo: true,
                        useCollegeLogo: true
                    }
                ]);
            }
        } catch (error) {
            console.log('Error fetching data:', error);
            // Fallback to 2 slides
            setOffers([
                {
                    $id: 'campus_eats_default_1',
                    title: "Campus Eats",
                    subtitle: "Your campus food delivery app",
                    color: theme.colors.primary,
                    showLogo: true,
                    useCampusEatsLogo: true
                },
                {
                    $id: 'college_default_2',
                    title: "Welcome",
                    subtitle: "Order from your favorite campus restaurants",
                    color: '#1E1E1E',
                    showLogo: true,
                    useCollegeLogo: true
                }
            ]);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    // Realtime subscription for instant updates
    useEffect(() => {
        const unsubscribeOffers = client.subscribe(
            `databases.${DATABASE_ID}.collections.${COLLECTIONS.OFFERS}.documents`,
            (response) => {
                fetchData();
            }
        );

        const unsubscribeSettings = client.subscribe(
            `databases.${DATABASE_ID}.collections.${COLLECTIONS.SETTINGS}.documents`,
            (response) => {
                fetchData();
            }
        );

        return () => {
            unsubscribeOffers();
            unsubscribeSettings();
        };
    }, []);

    const handleScroll = (event) => {
        const xOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(xOffset / CARD_WIDTH);
        if (index !== activeIndex && index >= 0 && index < offers.length) {
            setActiveIndex(index);
        }
    };

    const handleAction = (item) => {
        if (item.link) {
            Linking.openURL(item.link).catch(err => console.error("Couldn't load page", err));
        }
    };

    const renderItem = ({ item }) => {
        const hasLink = !!item.link;
        const isImageOnly = item.imageUrl && !item.title && !item.subtitle && !item.link;
        const isCampusEatsBranding = item.showLogo;

        return (
            <View style={styles.cardContainer}>
                <View
                    style={[styles.card, { backgroundColor: item.color || theme.colors.surface }]}
                >
                    {isCampusEatsBranding ? (
                        <View style={styles.brandingContainer}>
                            <Image
                                source={
                                    item.useCampusEatsLogo
                                        ? require('../../../assets/icon.png')
                                        : item.useCollegeLogo && logoUrl
                                            ? { uri: logoUrl }
                                            : require('../../../assets/icon.png')
                                }
                                style={styles.brandingLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.brandingTitle}>{item.title}</Text>
                            <Text style={styles.brandingSubtitle}>{item.subtitle}</Text>
                        </View>
                    ) : (
                        <>
                            {item.imageUrl ? (
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={[styles.bgImage, isImageOnly && { opacity: 1 }]}
                                    resizeMode="cover"
                                />
                            ) : null}

                            {!isImageOnly && (
                                <View style={styles.textContainer}>
                                    {item.title && <Text style={styles.title}>{item.title}</Text>}
                                    {item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}

                                    {hasLink && (
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => handleAction(item)}
                                            style={styles.ctaButton}
                                        >
                                            <Text style={styles.ctaText}>{item.buttonText || item.cta || "View Details"}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </>
                    )}
                </View>
            </View>
        );
    };

    if (offers.length === 0) return null;

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={offers}
                renderItem={renderItem}
                keyExtractor={item => item.$id}
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                snapToInterval={CARD_WIDTH + 20}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 20 }}
            />

            <View style={styles.pagination}>
                {offers.map((_, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.dot,
                            idx === activeIndex ? styles.activeDot : styles.inactiveDot
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.s,
    },
    cardContainer: {
        width: CARD_WIDTH,
    },
    card: {
        height: CARD_HEIGHT,
        borderRadius: theme.borderRadius.l,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        padding: 20,
        marginRight: 20,
    },
    bgImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6,
        backgroundColor: '#000',
    },
    textContainer: {
        zIndex: 1,
        maxWidth: '85%',
    },
    title: {
        fontSize: normalize(22),
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: vScale(4),
    },
    subtitle: {
        fontSize: normalize(14),
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: vScale(12),
    },
    ctaButton: {
        backgroundColor: '#FFF',
        paddingHorizontal: scale(20),
        paddingVertical: vScale(8),
        borderRadius: theme.borderRadius.s,
        alignSelf: 'flex-start',
        ...theme.shadows.small,
    },
    ctaText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: normalize(12),
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: vScale(12),
        gap: scale(6),
    },
    dot: {
        height: vScale(4),
        borderRadius: 2,
    },
    activeDot: {
        width: scale(16),
        backgroundColor: theme.colors.primary,
    },
    inactiveDot: {
        width: scale(4),
        backgroundColor: theme.colors.textSecondary,
        opacity: 0.3,
    },
    brandingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandingLogo: {
        width: scale(60),
        height: scale(60),
        marginBottom: vScale(8),
    },
    brandingTitle: {
        fontSize: normalize(28),
        fontWeight: '800',
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    brandingSubtitle: {
        fontSize: normalize(14),
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        maxWidth: '90%',
    },
});

export default OffersCarousel;
