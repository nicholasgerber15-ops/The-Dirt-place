import { Capacitor } from '@capacitor/core';

export const isCapacitor = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'
