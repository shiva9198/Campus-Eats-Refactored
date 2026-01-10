import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    ActivityIndicator,
    Easing,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FoodStackButton = ({
    title,
    onPress,
    loading = false,
    progress = 0,
    glow = false,
    isSuccess = false,
    onAnimationComplete,
    style,
    textStyle
}) => {
    const [layout, setLayout] = useState({ width: 0, height: 0 });
    const [items, setItems] = useState([]);
    const prevProgress = useRef(0);

    // Separate text opacity
    const textOpacity = useRef(new Animated.Value(1)).current;

    const activeIcons = [
        'pizza-outline', 'fast-food-outline', 'cafe-outline',
        'ice-cream-outline', 'beer-outline', 'wine-outline',
        'restaurant-outline', 'fish-outline'
    ];

    // -- PHYSICS: DROP & STACK --
    useEffect(() => {
        const currentCount = Math.floor(progress * 8);
        const prevCount = Math.floor(prevProgress.current * 8);

        if (currentCount > prevCount && layout.width > 0) {
            for (let i = 0; i < 12; i++) {
                setTimeout(() => triggerDrop(currentCount), i * 40);
            }
        } else if (currentCount < prevCount) {
            setItems(prev => prev.slice(0, currentCount * 12));
        }

        prevProgress.current = progress;
    }, [progress, layout.width]);

    // -- SEQUENCE: LOADING --
    useEffect(() => {
        if (loading) {
            // Hide text when loading starts
            Animated.timing(textOpacity, { toValue: 0, duration: 100, useNativeDriver: Platform.OS !== 'web' }).start();
        } else {
            // Show text when loading stops 
            Animated.timing(textOpacity, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start();
            if (isSuccess && onAnimationComplete) {
                onAnimationComplete();
            }
        }
    }, [loading, isSuccess]);


    const triggerDrop = (currentSlot) => {
        if (isSuccess) return;
        const id = Math.random();
        const icon = activeIcons[Math.floor(Math.random() * activeIcons.length)];
        const xPos = Math.random() * (layout.width * 0.9) + (layout.width * 0.05);
        const stackHeight = (currentSlot / 8) * layout.height;
        const targetY = layout.height - (Math.random() * stackHeight) - 15;
        const dropAnim = new Animated.Value(0);

        setItems(prev => [...prev, {
            id, icon, x: xPos, targetY, anim: dropAnim,
            rotation: (Math.random() - 0.5) * 90,
            scale: 0.8 + Math.random() * 0.6
        }]);

        Animated.timing(dropAnim, {
            toValue: 1,
            duration: 400 + Math.random() * 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web'
        }).start();
    };

    return (
        <View style={style}>
            <TouchableOpacity
                activeOpacity={0.9}
                style={[
                    styles.container,
                    glow && styles.glow,
                    isSuccess && styles.successButton,
                ]}
                onPress={(e) => {
                    console.log('FoodStackButton pressed', { title, loading, disabled: !glow || loading || isSuccess });
                    if (onPress) onPress(e);
                }}
                disabled={!glow || loading || isSuccess}
                onLayout={(e) => setLayout(e.nativeEvent.layout)}
            >
                <View style={styles.background} />

                {/* ITEMS */}
                <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                    {items.map(item => {
                        const dropY = item.anim.interpolate({
                            inputRange: [0, 1], outputRange: [-30, item.targetY]
                        });
                        return (
                            <Animated.View key={item.id} style={[
                                styles.foodIcon,
                                { left: item.x, transform: [{ translateY: dropY }, { rotate: `${item.rotation}deg` }, { scale: item.scale }] }
                            ]}>
                                <Ionicons name={item.icon} size={18} color="#FFA500" />
                            </Animated.View>
                        )
                    })}
                </View>

                {/* TEXT */}
                <Animated.View style={[styles.content, { opacity: textOpacity }]}>
                    {loading ? <ActivityIndicator color="#FFA500" /> : (
                        <Text style={[styles.text, glow ? styles.textFull : styles.textEmpty, textStyle]}>
                            {title}
                        </Text>
                    )}
                </Animated.View>

            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0F0F0F',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#222',
        zIndex: 10
    },
    glow: {
        borderColor: '#FF8C00',
        elevation: 10,
    },
    successButton: {
        backgroundColor: '#1a1a1a',
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050505',
    },
    content: {
        zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 10, borderRadius: 8
    },
    text: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    textEmpty: { color: '#444' },
    textFull: {
        color: '#FFF',
        textShadowColor: 'rgba(255,140,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3
    },
    foodIcon: { position: 'absolute', zIndex: 5 },
});

export default FoodStackButton;
