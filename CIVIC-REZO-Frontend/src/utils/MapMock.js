import React from 'react';
import { View, Text } from 'react-native';

const MapView = (props) => (
  <View style={[{ backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center' }, props.style]}>
    <Text style={{ color: '#666' }}>Map View (Not supported on Web)</Text>
  </View>
);

export const Marker = () => null;
export const Callout = () => null;
export const Circle = () => null;
export const Polygon = () => null;
export const Polyline = () => null;
export const PROVIDER_DEFAULT = 'default';
export const PROVIDER_GOOGLE = 'google';

MapView.Marker = Marker;
MapView.Callout = Callout;
MapView.Circle = Circle;
MapView.Polygon = Polygon;
MapView.Polyline = Polyline;

export default MapView;
