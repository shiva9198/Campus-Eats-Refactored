import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const LogoTitle = () => {
    const navigation = useNavigation();
    const { user } = useAuth();

    const handlePress = () => {
        if (user && user.role === 'admin') {
            navigation.navigate('AdminMain', { screen: 'Dashboard' });
            // Navigate to the stack then screen to ensure tab switch
        } else {
            navigation.navigate('Main', { screen: 'Home' });
        }
    };

    return (
        <TouchableOpacity onPress={handlePress}>
            <Image
                style={styles.logo}
                source={require('../../assets/logo.png')}
                resizeMode="contain"
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    logo: {
        width: 120, // Adjust based on your logo's aspect ratio
        height: 40,
        marginLeft: 10, // Add some spacing from the left edge
    },
});

export default LogoTitle;
