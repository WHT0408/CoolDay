import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';

import { 
    View, 
    Text, 
    Image, 
    Button, 
    StyleSheet, 
    Dimensions, 
    ActivityIndicator, 
    PermissionsAndroid, 
} from 'react-native';
import Icons from 'react-native-vector-icons/MaterialIcons';

import MapView from "react-native-map-clustering";
import Geolocation from 'react-native-geolocation-service';
import { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

const GOOGLE_MAPS_APIKEY = 'AIzaSyBhKUnbXmXD3eXdWP3iHspHFs73E1MjUF0';
var color, letters = '0123456789ABCDEF'.split('');

export default class MapScreen extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            loading: true,
            locatLoading: true,
            activities: [],
            currentLocation: {},
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                'title': 'ReactNativeCode Location Permission',
                'message': 'ReactNativeCode App needs access to your location '
            })

        if (granted) {
            Geolocation.getCurrentPosition(
                position => {
                    this.setState({
                        locatLoading: false,
                        currentLocation: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        },
                    });
                },
                error => {
                  Alert.alert(error.message.toString());
                },
                {
                  showLocationDialog: true,
                  enableHighAccuracy: true,
                  timeout: 20000,
                  maximumAge: 0
                }
            );
        }     
           
        Geolocation.watchPosition(
            position => {
              this.setState({
                locatLoading: false,
                currentLocation: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }
              });
            },
            error => {
              console.log(error);
            },
            {
              showLocationDialog: true,
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 0,
              distanceFilter: 0
            }
        );

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
        //const point = this.getRegionForCoordinates(activities);

        var markerLoop = [];
        for (let i = 0; i < activities.length; i++) {
        // for (let i = 0; i < 10; i++) {
            if(this.getActivityType(activities[i]) == 'Eat'){
                markerLoop.push(
                    //<View key={i}>
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
                    //</View>
                );
            }
            else if(this.getActivityType(activities[i]) == 'Buy'){
                markerLoop.push(
                    //<View key={i}>
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
                    //</View>
                );
            }
            else if(this.getActivityType(activities[i]) == 'Play'){
                markerLoop.push(
                    //<View key={i}>
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
                    //</View>
                );
            }
        }

        return(
            <View style={styles.map}>
                <MapView
                    provider={PROVIDER_GOOGLE} 
                    radius = {30} 
                    clusterColor = "#00DDDD"
                    style={styles.map} 
                    //borderRadius = {0}
                    
                    ref = {(ref) => this.mapView = ref}
                    clusteringEnabled = {true}
                    showsUserLocation={true}
                    minZoomLevel={10}  
                    maxZoomLevel={18} 
                    mapClusterImage = {(<Image style = {styles.mapClusterImage} source = {require('../../image/test.png')}/>)}
                    showsMyLocationButton = {true}
                    customClusterMarkerDesign = {(<Image style = {styles.mapClusterImage} source = {require('../../image/test.png')}/>)}
                    initialRegion={{
                        latitude: this.state.currentLocation.latitude,
                        longitude: this.state.currentLocation.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                    
                    
                    // region={{
                    //     latitude: this.state.currentLocation.latitude,
                    //     longitude: this.state.currentLocation.longitude,
                    //     latitudeDelta: 0.0922,
                    //     longitudeDelta: 0.0421,
                    // }}
                >
                    {markerLoop}
                </MapView>
                <View style={styles.Type}>
                    <View style={[styles.avatar, {}]}><Image style={styles.avatarImage} source = {require('../../image/restaurant.png')} ></Image></View>
                    <Text style={styles.typeName}>飲食</Text>
                </View>
                <View style={styles.Type}>
                    <View style={[styles.avatar, {}]}><Image style={styles.avatarImage} source = {require('../../image/play.png')} ></Image></View>
                    <Text style={styles.typeName}>娛樂</Text>
                </View>
                <View style={styles.Type}>
                    <View style={[styles.avatar, {}]}><Image style={styles.avatarImage} source = {require('../../image/shop.png')} ></Image></View>
                    <Text style={styles.typeName}>購買</Text>
                </View>
                <View style={styles.Button}>
                {/* <Button 
                name="my-location" 
                size={45} 
                style={styles.focus}
                //onPress={this._getLocation}
                title="My Location"></Button> */}
                </View>
                
            </View>
        )
    }
    // _getLocation = async () => {
    //     await Geolocation.getCurrentPosition(position => {
    //       // this.setState({ coords: position.coords, loading: false });
    //       const region = {
    //         latitude: position.coords.latitude,
    //         longitude: position.coords.longitude,
    //         latitudeDelta: 0.012,
    //         longitudeDelta: 0.01
    //       };
    //       this.animate(region);
    //     });
    // };




    render() {
        const { loading, locatLoading } = this.state;
        const { filter } = this.props.route.params;
        if(!loading && !locatLoading){
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
    Type: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,1)',
        borderRadius: 20,
        height: 45,
        marginTop: 10,
        width: 80,
      },
    typeName: {
        marginHorizontal: 10,
        fontSize: 15,
    },
    avatar: {
        height: 30,
        width: 30,
        borderRadius: 15,
    },
    avatarImage:{
        height:40, 
        width:40,
    },
    focus: {

        backgroundColor: 'blue', 
        borderRadius: 20,

        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    Button:{
        bottom: 10, 
        right: 10, 
        height: 45,
        width:150,
        position: 'absolute',
    },
    mapClusterImage:{
        width: 99,
        height: 99
    }
});