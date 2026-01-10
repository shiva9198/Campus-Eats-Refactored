import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { fetchCampusBranding } from '../api/client';

interface BrandingLogoProps {
    style?: StyleProp<ImageStyle>;
}

export const BrandingLogo = ({ style }: BrandingLogoProps) => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        const loadBranding = async () => {
            try {
                const branding = await fetchCampusBranding();
                if (branding && branding.logoUrl) {
                    let url = branding.logoUrl;
                    if (url.startsWith('/')) {
                        const { API_BASE_URL } = require('../config');
                        url = `${API_BASE_URL}${url}`;
                    }
                    setLogoUrl(url);
                }
            } catch (err) {
                if (__DEV__) { console.log('Branding fetch failed', err); }
            }
        };
        loadBranding();
    }, []);

    return (
        <Image
            source={logoUrl ? { uri: logoUrl } : require('../assets/logo_in_app.png')}
            style={style}
            resizeMode="contain"
        />
    );
};
