import React, { Component } from 'react';

import { 
    View, 
    Text, 
    Image, 
    StyleSheet, 
    Dimensions, 
    ActivityIndicator, 
    PermissionsAndroid, 
} from 'react-native';
import { Icon } from 'react-native-elements';

import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';


// import Geolocation from '@react-native-community/geolocation';

const GOOGLE_MAPS_APIKEY = 'AIzaSyBhKUnbXmXD3eXdWP3iHspHFs73E1MjUF0';
var color, letters = '0123456789ABCDEF'.split('');

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height


export default class ScheduleMapScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentLocation: {},
            loading: true,
            point: {},
        }
    }
    
    componentDidMount() {
        this.initialData();
    }

    // componentWillUnmount = () => {
    //     //Geolocation.clearWatch(this.watchID);
    // }

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
                    const { itineraryAct } = this.props.route.params;
                    var allPoints = [];
                    var currentLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    }

                    for(var i=0; i<itineraryAct.length; i++){
                        if(i==0){
                            allPoints.push(currentLocation);
                        }
                        allPoints.push(itineraryAct[i].geometry.location);
                    }
                    var point = this.getRegionForCoordinates(allPoints);

                    this.setState({
                        loading: false,
                        currentLocation: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        },
                        point: point,
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
                currentLocation: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
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
    }

    getRegionForCoordinates(points) {
        // points should be an array of { latitude: X, longitude: Y }
        let minX, maxX, minY, maxY;

        // init first point
        ((point) => {
          minX = point.lat;
          maxX = point.lat;
          minY = point.lng;
          maxY = point.lng;
        })(points[0]);
      
        // calculate rect
        points.map((point) => {
          minX = Math.min(minX, point.lat);
          maxX = Math.max(maxX, point.lat);
          minY = Math.min(minY, point.lng);
          maxY = Math.max(maxY, point.lng);
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

    getActivityType(types){
        let type = "";
        if(types.includes('restaurant'))
          type = "Eat";
        else if(types.includes('shopping_mall') || 
                types.includes('department_store'))
          type = "Buy";
        else if(types.includes('tourist_attraction') || 
                types.includes('amusement_park') || 
                types.includes('art_gallery') || 
                types.includes('movie_theater') || 
                types.includes('bowling_alley') || 
                types.includes('museum') || 
                types.includes('gym'))
          type = "Play"
        return type
    }

    getAllPoints(points){
        const allPoints = [];
        for(var i=0; i<points.length; i++){
            if(i==0){
                allPoints.push(this.state.currentLocation);
            }
            allPoints.push(points[i].geometry.location);
        }
        return allPoints;
    }

    _getLocation = async () => {
        await Geolocation.getCurrentPosition(position => {
          // this.setState({ coords: position.coords, loading: false });
          const region = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.01
          };
          this.map.animateToRegion(region, 500);
        });
    };

    render() {
        const { loading } = this.state;
        const { itineraryAct, name } = this.props.route.params;

        // var allPoints = [];

        // if(this.state.currentLocation != null){
        //     allPoints = this.getAllPoints(itineraryAct);
        //     this.getRegionForCoordinates(allPoints);
        // }


        this.props.navigation.setOptions({title:name});

        var routeLoop = [];
        for (let i = 0; i < itineraryAct.length-1; i++) {
            // var ColorCode = 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';
            var ColorCode = this.getRandomColor();
            if(i==0){
                routeLoop.push(
                    <View key={i}>
                        <MapViewDirections
                                origin={{ latitude: this.state.currentLocation.lat, longitude: this.state.currentLocation.lng }}
                                destination={{ latitude: itineraryAct[i].geometry.location.lat, longitude: itineraryAct[i].geometry.location.lng }}
                                apikey={GOOGLE_MAPS_APIKEY}
                                strokeWidth={3}
                                strokeColor={this.getRandomColor()}
                        />
                    </View>
                );
            }
            routeLoop.push(
              <View key={i+1}>
                    <MapViewDirections
                            origin={{ latitude: itineraryAct[i].geometry.location.lat, longitude: itineraryAct[i].geometry.location.lng }}
                            destination={{ latitude: itineraryAct[i+1].geometry.location.lat, longitude: itineraryAct[i+1].geometry.location.lng }}
                            apikey={GOOGLE_MAPS_APIKEY}
                            strokeWidth={3}
                            strokeColor={ColorCode}
                    />
              </View>
            );
        }

        var markerLoop = [];
        for (let i = 0; i < itineraryAct.length; i++) {
            if(i == 0){
                markerLoop.push(
                    <View key={i}>
                        <Marker 
                            coordinate={{ latitude: itineraryAct[i].geometry.location.lat, longitude: itineraryAct[i].geometry.location.lng }}
                            title={itineraryAct[i].name}
                            description={itineraryAct[i].formatted_address}
                            image={require('../../image/greenflag.png')}
                            onCalloutPress={() => this.props.navigation.navigate("EventDetailScreen", {
                                activity: itineraryAct[i],
                            })}
                        >
                            {/* <Image style={styles.greenflag} source={require('../../image/greenflag.png')} /> */}
                        </Marker>
                    </View>
                );
            }
            else if(i == itineraryAct.length-1){
                markerLoop.push(
                    <View key={i}>
                        <Marker 
                            coordinate={{ latitude: itineraryAct[i].geometry.location.lat, longitude: itineraryAct[i].geometry.location.lng }}
                            title={itineraryAct[i].name}
                            description={itineraryAct[i].formatted_address}
                            image={require('../../image/redflag.png')}
                            onCalloutPress={() => this.props.navigation.navigate("EventDetailScreen", {
                                activity: itineraryAct[i],
                            })}
                        >
                            {/* <Image style={styles.redflag} source={require('../../image/redflag.png')} /> */}
                        </Marker>
                    </View>
                );
            }
            else{
                const type = this.getActivityType(itineraryAct[i].types);
                if(type == 'Eat'){
                    markerLoop.push(
                        <View key={i}>
                            <Marker 
                                coordinate={{ latitude: itineraryAct[i].geometry.location.lat, longitude: itineraryAct[i].geometry.location.lng }}
                                title={itineraryAct[i].name}
                                description={itineraryAct[i].formatted_address}
                                image={require('../../image/restaurant.png')}
                                onCalloutPress={() => this.props.navigation.navigate("EventDetailScreen", {
                                    activity: itineraryAct[i],
                                })}
                            >
                            </Marker>
                        </View>
                    );
                }
                else if(type == 'Play'){
                    markerLoop.push(
                        <View key={i}>
                            <Marker 
                                coordinate={{ latitude: itineraryAct[i].geometry.location.lat, longitude: itineraryAct[i].geometry.location.lng }}
                                title={itineraryAct[i].name}
                                description={itineraryAct[i].formatted_address}
                                image={require('../../image/play.png')}
                                onCalloutPress={() => this.props.navigation.navigate("EventDetailScreen", {
                                    activity: itineraryAct[i],
                                })}
                            >
                            </Marker>
                        </View>
                    );
                }
                else if(type == 'Buy'){
                    markerLoop.push(
                        <View key={i}>
                            <Marker 
                                coordinate={{ latitude: itineraryAct[i].geometry.location.lat, longitude: itineraryAct[i].geometry.location.lng }}
                                title={itineraryAct[i].name}
                                description={itineraryAct[i].formatted_address}
                                image={require('../../image/shop.png')}
                                onCalloutPress={() => this.props.navigation.navigate("EventDetailScreen", {
                                    activity: itineraryAct[i],
                                })}
                            >
                            </Marker>
                        </View>
                    );
                }
            }
        }

        if(!loading){
            return (
                <View style={styles.container}>
                    <MapView
                        ref={map => (this.map = map)}
                        provider={PROVIDER_GOOGLE} 
                        style={styles.map} 
                        showsUserLocation={true}
                        showsMyLocationButton={true}
                        initialRegion={{
                            latitude: this.state.point.latitude,
                            longitude: this.state.point.longitude,
                            latitudeDelta: this.state.point.latitudeDelta,
                            longitudeDelta: this.state.point.longitudeDelta,
                        }}
                    >
                        {markerLoop}
                        {routeLoop}
                    </MapView>
                    <Icon 
                    name="my-location" 
                    size={45} color={'black'} 
                    containerStyle={styles.focus}
                    onPress={this._getLocation}
                    />
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
    greenflag: {
        width: 40,
        height: 40,
    },
    redflag: {
        width: 50,
        height: 50,
    },
    focus: {
        top: height*0.35, 
        left: width*0.35, 
        backgroundColor: 'white', 
        borderRadius: 44/2,
    },
});