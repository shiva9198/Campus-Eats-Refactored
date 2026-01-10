import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device (iPhone 11/14 size approx)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * Scales width/horizontal dimensions
 * @param size
 */
const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * Scales height/vertical dimensions
 * @param size
 */
const vScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/**
 * Moderate scale with factor
 * @param size
 * @param factor
 */
const mScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Normalizes font size across different screen densities
 * @param size
 */
const normalize = (size) => {
    const newSize = scale(size);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export { scale, vScale, mScale, normalize, SCREEN_WIDTH, SCREEN_HEIGHT };
