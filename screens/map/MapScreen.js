import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';

import { 
    View, 
    Text, 
    Image, 
    StyleSheet, 
    ActivityIndicator, 
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

const GOOGLE_MAPS_APIKEY = 'AIzaSyBhKUnbXmXD3eXdWP3iHspHFs73E1MjUF0';
var color, letters = '0123456789ABCDEF'.split('');

export default class MapScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            activities: [],
        }
    }

    async componentDidMount() {
        firebase.database().ref('activities').on('value', (snapshot) => {
            let activities = snapshot.val();
        
            this.setState({
                loading: false,
                activities: activities,
            });
        });
    }

    getRegionForCoordinates(points) {
        // points should be an array of { latitude: X, longitude: Y }
        let minX, maxX, minY, maxY;
      
        // init first point
        ((point) => {
          minX = point.geometry.location.lat;
          maxX = point.geometry.location.lat;
          minY = point.geometry.location.lng;
          maxY = point.geometry.location.lng;
        })(points[0]);
      
        // calculate rect
        points.map((point) => {
          minX = Math.min(minX, point.geometry.location.lat);
          maxX = Math.max(maxX, point.geometry.location.lat);
          minY = Math.min(minY, point.geometry.location.lng);
          maxY = Math.max(maxY, point.geometry.location.lng);
        });
      
        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;
        const deltaX = (maxX - minX)+0.05;
        const deltaY = (maxY - minY)+0.05;
      
        return {
          latitude: midX,
          longitude: midY,
          latitudeDelta: deltaX,
          longitudeDelta: deltaY
        };
    }

    getRandomColor() {
        color = '#'
        color += letters[Math.round(Math.random() * 5 )];
        for (var i = 0; i < 5; i++) {
            color += letters[Math.round(Math.random() * 15 )];
        }
        return color
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

    getFilterActivity(filter){
        const sections = [];
        let activityType;

        for(var i=0; i<this.state.activities.length; i++){
          activityType = this.getActivityType(this.state.activities[i]);
          if(filter == 'All'){
            sections.push(this.state.activities[i]);
          }
          else{
            if(activityType == filter){
              sections.push(this.state.activities[i]);
            }
          }
        }
        //this.props.navigation.navigation.setOptions({title:'List' + filter});
        return sections;
    }

    renderView(activities){
        const point = this.getRegionForCoordinates(activities);

        var markerLoop = [];
        for (let i = 0; i < activities.length; i++) {
            if(this.getActivityType(activities[i]) == 'Eat'){
                markerLoop.push(
                    <View key={i}>
                        <Marker 
                            coordinate={{ latitude: activities[i].geometry.location.lat, longitude: activities[i].geometry.location.lng }}
                            title={activities[i].name}
                            description={activities[i].formatted_address}
                            image={require('../../image/restaurant.png')}
                            onCalloutPress={() => this.props.navigation.navigate("EventDetailScreen", {
                                activity: activities[i],
                            })}
                        >

                        </Marker>
                    </View>
                );
            }
            else if(this.getActivityType(activities[i]) == 'Buy'){
                markerLoop.push(
                    <View key={i}>
                        <Marker 
                            coordinate={{ latitude: activities[i].geometry.location.lat, longitude: activities[i].geometry.location.lng }}
                            title={activities[i].name}
                            description={activities[i].formatted_address}
                            image={require('../../image/shop.png')}
                            onCalloutPress={() => this.props.navigation.navigate("EventDetailScreen", {
                                activity: activities[i],
                            })}
                        >

                        </Marker>
                    </View>
                );
            }
            else if(this.getActivityType(activities[i]) == 'Play'){
                markerLoop.push(
                    <View key={i}>
                        <Marker 
                            coordinate={{ latitude: activities[i].geometry.location.lat, longitude: activities[i].geometry.location.lng }}
                            title={activities[i].name}
                            description={activities[i].formatted_address}
                            image={require('../../image/play.png')}
                            onCalloutPress={() => this.props.navigation.navigate("EventDetailScreen", {
                                activity: activities[i],
                            })}
                        >

                        </Marker>
                    </View>
                );
            }
        }

        return(
            
                <MapView
                    provider={PROVIDER_GOOGLE} 
                    style={styles.map} 
                    initialRegion={{
                        latitude: point.latitude,
                        longitude: point.longitude,
                        latitudeDelta: point.latitudeDelta,
                        longitudeDelta: point.longitudeDelta,
                    }}
                >
                    {markerLoop}
                </MapView>
        )
    }

    render() {
        const { loading } = this.state;
        const { filter } = this.props.route.params;
        if(!loading){
            return (
                <View style={styles.container}>
                {this.renderView(this.getFilterActivity(filter))}
                </View>
            );
        }
        else{
            return <ActivityIndicator />
        }
    }
}

const styles = StyleSheet.create({
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
    restaurant: {
        width: 40,
        height: 40,
    },
});