import React, { Component } from 'react';

import { 
    View, 
    Text, 
    StyleSheet, 
} from 'react-native';

import MapViewDirections from 'react-native-maps-directions';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

export default class EventMapScreen extends React.Component {
    constructor(props) {
        super(props);
    }
    
    getRegionForCoordinates(point) {
        // points should be an array of { latitude: X, longitude: Y }
        let minX, maxX, minY, maxY;
      
        // init first point
          minX = point.geometry.location.lat;
          maxX = point.geometry.location.lat;
          minY = point.geometry.location.lng;
          maxY = point.geometry.location.lng;
      
        // calculate rect
          minX = Math.min(minX, point.geometry.location.lat);
          maxX = Math.max(maxX, point.geometry.location.lat);
          minY = Math.min(minY, point.geometry.location.lng);
          maxY = Math.max(maxY, point.geometry.location.lng);
      
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const deltaX = (maxX - minX)+0.0005;
        const deltaY = (maxY - minY)+0.0005;
      
        return {
          latitude: midX,
          longitude: midY,
          latitudeDelta: deltaX,
          longitudeDelta: deltaY
        };
    }

    getActivityType(activity){
        let type = "";
        if(activity.types.includes('restaurant'))
          type = "Eat";
        else if(activity.types.includes('shopping_mall') || 
                activity.types.includes('department_store'))
          type = "Buy";
        else if(activity.types.includes('tourist_attraction') || 
                activity.types.includes('amusement_park') || 
                activity.types.includes('art_gallery') || 
                activity.types.includes('movie_theater') || 
                activity.types.includes('bowling_alley') || 
                activity.types.includes('museum') || 
                activity.types.includes('gym'))
          type = "Play"
        return type
      }

    render() {
        const { activity } = this.props.route.params;
        const point = this.getRegionForCoordinates(activity);
        this.props.navigation.setOptions({title:activity.name});
        const type = this.getActivityType(activity);

        var markerLoop = [];
        if(type == 'Eat'){
            markerLoop.push(
                <View key={0}>
                    <Marker
                        coordinate={{ latitude: activity.geometry.location.lat, longitude: activity.geometry.location.lng }}
                        title={activity.name}
                        description={activity.formattedAddress}
                        image={require('../../image/restaurant.png')}
                    />   
                </View>
            )
        }
        else if(type == 'Play'){
            markerLoop.push(
                <View key={0}>
                    <Marker
                        coordinate={{ latitude: activity.geometry.location.lat, longitude: activity.geometry.location.lng }}
                        title={activity.name}
                        description={activity.formattedAddress}
                        image={require('../../image/play.png')}
                    />   
                </View>
            )
        }
        else if(type == 'Buy'){
            markerLoop.push(
                <View key={0}>
                    <Marker
                        coordinate={{ latitude: activity.geometry.location.lat, longitude: activity.geometry.location.lng }}
                        title={activity.name}
                        description={activity.formattedAddress}
                        image={require('../../image/shop.png')}
                    />   
                </View>
            )
        }

        return (
            <View style={Styles.container}>
                <MapView
                    provider={PROVIDER_GOOGLE} 
                    style={Styles.map} 
                    initialRegion={{
                        latitude: point.latitude,
                        longitude: point.longitude,
                        latitudeDelta: point.latitudeDelta,
                        longitudeDelta: point.longitudeDelta,
                    }}
                >
                    {/* <Marker
                        coordinate={{ latitude: activity.geometry.location.lat, longitude: activity.geometry.location.lng }}
                        title={activity.name}
                        description={activity.formattedAddress}
                    />    */}
                    {markerLoop}
                </MapView>
            </View>
        );
    }
}

const Styles = StyleSheet.create({
    container:{
        flex: 1,
        alignItems: 'center', 
        justifyContent: 'center', 
    }, 
    title: {
        fontSize: 40, 
    }, 
    map: {
        flex: 1,
        ...StyleSheet.absoluteFillObject, 
    }, 
});