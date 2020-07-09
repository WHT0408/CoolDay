import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';

import { 
    View, 
    Text, 
    Alert, 
    Image, 
    WebView, 
    Linking, 
    Dimensions, 
    ScrollView, 
    StyleSheet, 
    RefreshControl, 
    ImageBackground, 
    TouchableOpacity, 
    ActivityIndicator, 
} from 'react-native';

import { Icon } from 'react-native-elements';

import ImagesSwiper from "react-native-image-swiper";
import getDirections from 'react-native-google-maps-directions';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';

import Login from '../account/Login';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class EventDetailScreen extends React.Component {
    _isMounted = false;

    constructor(props) {
        super(props);

        this.state = {
            isInitPage: true,
            isShow: false,
            phoneNumber: '',
            website: '',
            openHours: {},
            weekdayText: {},
            favActId: [],
            isFavorite: false,
            loading: true,
            refreshing: false,
            loggedIn: false,
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        firebase.auth().onUserChanged((user) => {
            if(user){
                this.setState({ loggedIn: true})
            } else {
                this.setState({ 
                    loggedIn: false,
                    loading: false,
                })
            }
        })


        const user = firebase.auth().currentUser;
        const docRef = firebase
        .firestore()
        .collection('Users')
        .doc(user.uid);

        data = (await docRef.get()).data();
        const { favActId } = data;

        this.setState({
            favActId: favActId,
            loading: false,
        });
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

    getActivityDescIcon(type){
        let iconName = "";
        if(type == "Eat"){
            iconName = "restaurant-menu";
        }
        else if(type == "Play"){
            iconName = "face";
        }
        else if(type == "Buy"){
            iconName = "shopping-cart";
        }
        return iconName;
    }

    getActivityDesc(activity){
        let activityDesc = "";
        for(var i=0; i<activity.types.length; i++){
            activityDesc += activity.types[i] + " ";
        }
        return activityDesc;
    }

    renderName(activity){
        const { name } = activity;
        return(
            <Text style={styles.name}>{name}</Text>
        );
    }

    getImageUrl(photoRef){
        const url = "https://maps.googleapis.com/maps/api/place/photo?";
        const maxwidth = `maxwidth=400`;
        const photoreference = `&photoreference=${photoRef}`;
        const api_key = `&key=AIzaSyBhKUnbXmXD3eXdWP3iHspHFs73E1MjUF0`;
        return `${url}${maxwidth}${photoreference}${api_key}`;
    }

    getImgSet(photos){
        const imgSet = []
        for(var i=0; i<photos.length; i++){
            let url = this.getImageUrl(photos[i].photo_reference)
            imgSet.push(url);
        }
        return imgSet;
    }


    renderImage(activity){
        const { photos } = activity;
        const imageSet = photos?this.getImgSet(photos):"";
        return (
        //   <ImageBackground style={styles.activityImage} source={{ uri: image ? image : undefined }}>
        //   </ImageBackground>
            <ImagesSwiper 
                images={imageSet?imageSet:undefined}
                autoplay={true} 
                autoplayTimeout={3}
                showsPagination={false}
                width={width} 
                height={height - 500} 
            />
        );
    }

    isFav(favActId, activity){
        var isFav = false;
        if(favActId!=null){
            for(var i=0; i<favActId.length; i++){
                if(favActId[i] == activity.place_id && this.state.isInitPage == true){
                    this.setState({
                        isFavorite: true,
                        isInitPage: false,
                    });
                }
            }
        }
        return isFav;
    }

    renderButton(activity){
        const showAlert = () =>
        Alert.alert(
          "Error",
          "Please login first!",
          [
            // {
            //   text: "Cancel",
            //   onPress: () => console.log("Cancel Pressed"),
            //   style: "cancel"
            // },
            { text: "OK", onPress: () => console.log("OK Pressed") }
          ],
          { cancelable: false }
        );
        const { favActId } = this.state;
        this.isFav(favActId, activity);
        const { isFavorite, loggedIn } = this.state;
        const isFavIcon = isFavorite?'favorite':'favorite-border';
        const isFavText = isFavorite?'已收藏':'收藏';
        const isFavColor = isFavorite?'#FF8C00':'black';
        if(loggedIn){
            return(
                <View style={styles.rowContainer}> 
                    <View>
                        <TouchableOpacity style={styles.like} onPress={()=>this.toggleChBtn(activity)}>
                            <Icon name={isFavIcon} size={45} color={isFavColor} />
                            <Text style={styles.favtext}>{isFavText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }
        else{
            return(
                <View style={styles.rowContainer}> 
                    <View>
                        <TouchableOpacity style={styles.like} onPress={showAlert}>
                        {/* <TouchableOpacity style={styles.like} onPress={() => this.props.navigation.navigate("Login")} > */}
                            <Icon name={isFavIcon} size={45} color={isFavColor} />
                            <Text style={styles.favtext}>{isFavText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }
    }

    getDetailsUrl(place_id){
        const url = "https://maps.googleapis.com/maps/api/place/details/json?";
        const fields = `fields=formatted_phone_number,opening_hours,website`;
        const language = `&language=zh-HK`;
        const placeid = `&placeid=${place_id}`;
        const api_key = `&key=AIzaSyBhKUnbXmXD3eXdWP3iHspHFs73E1MjUF0`;
        return `${url}${fields}${language}${placeid}${api_key}`;
    }

    getActivityDetail(activity){
        const place_id = activity.place_id;
        const url = this.getDetailsUrl(place_id);
        this._isMounted = true;
        fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(responseJson => {
            if (this._isMounted) {
                this.setState({ 
                    phoneNumber: responseJson.result.formatted_phone_number,
                    openHours: responseJson.result.opening_hours,
                    website: responseJson.result.website,
                    weekdayText: responseJson.result.opening_hours.weekday_text,
                });
            }
        })
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    toggleChBtn(activity){
        const user = firebase.auth().currentUser;
        const { place_id } = activity;
        if(this.state.isFavorite == false){
            const docRef = firebase
            .firestore()
            .collection('Users')
            .doc(user.uid)
            .update({
                favActId: firestore.FieldValue.arrayUnion(place_id),
            });
        }
        else{
            const docRef = firebase
            .firestore()
            .collection('Users')
            .doc(user.uid)
            .update({
                favActId: firestore.FieldValue.arrayRemove(place_id),
            });
        }

        this.setState({
            isFavorite: !this.state.isFavorite,
        });
    }

    toggleShowWeekDay(){
        this.setState({ 
            isShow: !this.state.isShow,
        })
    }

    getToday(){
        let index = 0;
        const today = moment().format('dddd');
        if(today == "Monday")
            index = 0;
        else if(today == "Tuesday")
            index = 1;
        else if(today == "Wednesday")
            index = 2;
        else if(today == "Thursday")
            index = 3;
        else if(today == "Friday")
            index = 4;
        else if(today == "Saturday")
            index = 5;
        else if(today == "Sunday")
            index = 6;
        return index;
    }

    renderActivityInfo(activity){
        this.getActivityDetail(activity);
        const activityType = this.getActivityType(activity);
        const iconName = this.getActivityDescIcon(activityType);
        const description = this.getActivityDesc(activity);
        const telephone = this.state.phoneNumber;
        const openNow = this.state.openHours.open_now;
        const todayIndex = this.getToday();
        const weekday = this.state.weekdayText;
        const openNowText = openNow?"營業中: ":"休息中: ";
        const website = this.state.website;

        var todayStat = [];
        todayStat.push(
            <View key={0}>
                <TouchableOpacity style={styles.todayStat} onPress={()=>this.toggleShowWeekDay()}>
                    <Icon type="octicon" name="primitive-dot" size={30} color={openNow?'green':'red'} containerStyle ={{left:5}}/>
                    <Text style={openNow?styles.opennowGreen:styles.opennowRed}>{openNowText}</Text>
                    <Text style={styles.todayInfo}>{weekday[todayIndex]}</Text>
                    <Icon type='ionicon' name={this.state.isShow?'ios-arrow-up':'ios-arrow-down'} containerStyle={styles.arrow} size={25} color="#000" />
                </TouchableOpacity>
            </View>
        );

        var weekdayLoop = [];
        if(this.state.isShow == true){
        weekdayLoop.push(
            <Text style={styles.weekdayLoop_Header}>營業時間 :</Text>
        );
        }
        for (let i = 0; i < weekday.length; i++) {
            if(this.state.isShow == true){
                weekdayLoop.push(                  
                    <View key={i}>
                        <Text style={styles.information}>{weekday[i]}</Text>
                    </View>
                );
            }
        }

        return(
          <View>
            {/* <View style={styles.rowContainer}>
                <Icon name={iconName} size={30} color="#000" />
                <Text style={styles.information}>{description}</Text>
            </View> */}
            <View style={{}}>
                {todayStat}
                <View style={{flexDirection: "column",}}>
                    {weekdayLoop}
                </View>
            </View>

            <View style={styles.rowContainer}>
                <Icon type='material-community' name="web" size={30} color="#000" containerStyle={styles.info_Icon}/>
                <Text style={styles.info_Web}  onPress={()=>Linking.openURL(website)} >{website} </Text>
            </View>

            <View style={styles.rowContainer}>
              <Icon name="call" size={30} color="#000" containerStyle={styles.info_Icon}/>
              <Text style={styles.info_Phone} onPress={()=>Linking.openURL(`tel:${telephone}`)}>{telephone}</Text>
            </View>

          </View>
    
    
        );
    }

    renderMap(activity){
        const { name, geometry, formatted_address } = activity;
        const type = this.getActivityType(activity);
        let point = this.getRegionForCoordinates(activity);
        var Markerloop = [];
        if(type == 'Eat'){
            Markerloop.push(
                <View key={0}>
                    <Marker 
                        coordinate={{ latitude: geometry.location.lat, longitude: geometry.location.lng }}
                        title={name}
                        description={formatted_address}
                        image={require('../../image/restaurant.png')}
                    />
                </View>
            )
        }
        else if(type == 'Play'){
            Markerloop.push(
                <View key={0}>
                    <Marker 
                        coordinate={{ latitude: geometry.location.lat, longitude: geometry.location.lng }}
                        title={name}
                        description={formatted_address}
                        image={require('../../image/play.png')}
                    />
                </View>
            )
        }
        else if(type == 'Buy'){
            Markerloop.push(
                <View key={0}>
                    <Marker 
                        coordinate={{ latitude: geometry.location.lat, longitude: geometry.location.lng }}
                        title={name}
                        description={formatted_address}
                        image={require('../../image/shop.png')}
                    />
                </View>
            )
        }

        return(
            <View>
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                    latitude: point.latitude,
                    longitude: point.longitude,
                    latitudeDelta: point.latitudeDelta,
                    longitudeDelta: point.longitudeDelta,
                    }}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    // onPress={() => this.props.navigation.navigate("ActivityMapScreen", {
                    //     activity: activity,
                    // })}
                >
                    {/* <Marker 
                        coordinate={{ latitude: geometry.location.lat, longitude: geometry.location.lng }}
                        title={name}
                        description={formatted_address}
                    /> */}
                    {Markerloop}
                </MapView>
                <Icon 
                    name="zoom-out-map" 
                    containerStyle={styles.zoomoutmap} 
                    size={30} 
                    color="#000"
                    onPress={() => this.props.navigation.navigate("EventMapScreen", {
                        activity: activity,
                    })}
                />
            </View>
        );
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
    
    handleGetDirections = (activity) => {
        const source_latitude = activity.location.latitude;
        const source_longitude = activity.location.longitude;

        const data = {
            params: [
                {
                    key: "travelmode",
                    value: "driving"        // may be "walking", "bicycling" or "transit" as well
                },
                {
                    key: "dir_action",
                    value: "navigate"       // this instantly initializes navigation using the given travel mode
                }
            ],

            source: {
                latitude: source_latitude,
                longitude: source_longitude,
            },

            destination: {
                latitude: source_latitude,
                longitude: source_longitude,
            },
        }
     
        getDirections(data)
    }

    _onRefresh(){
        this.setState({ refreshing: true, });
        this.initialData().then(() => {
            this.setState({ refreshing: false, });
        });
    }

    render() {
        // const { infos } = this.props.route.params.activity;
        const { name } = this.props.route.params.activity;
        this.props.navigation.setOptions({title:name});
        const { loading } = this.state;

        if(!loading){
            return (
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this._onRefresh.bind(this)}
                        />
                    }
                >
                    {this.renderImage(this.props.route.params.activity)}
                    {this.renderButton(this.props.route.params.activity)}
                    {this.renderActivityInfo(this.props.route.params.activity)}
                    {this.renderMap(this.props.route.params.activity)}
                </ScrollView>
            );  
        }
        else{
            return <ActivityIndicator />
        }
    }
}

const styles = StyleSheet.create({
    activityImage: {
        width: '100%',
        height: height/100*30,
    },
    rowContainer: {
        margin: 10,
        flexDirection: "row",
        right:0,
    },
    rowContainerRight: {
        flexDirection: "row",
        right: 20,
        alignSelf: "flex-end",
        position: "absolute",

    },
    like: {
        flexDirection: "row",
    },
    information: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
        fontSize: 20,
        flexDirection: "column",
        marginLeft: 85,
    },
    opennowGreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
        fontSize: 20,
        color: 'green',

    },
    opennowRed: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
        fontSize: 20,
        color: 'red',

    },
    facebook: {
        marginLeft:10,
        marginRight:5,
        width: 43,
        height: 43,
    },
    openrice: {
        width: 46.5,
        height: 46.5,
    },
    favtext: {
        marginLeft: 3,
        marginTop: 7,
        fontSize: 25,
    },
    info_Icon:{
        textAlignVertical: 'center',
        fontSize: 30,
    },
    info_Web:{
        color:'#0000EE',
        textDecorationLine: 'underline',
        paddingLeft: 10,
        textAlignVertical: 'center',
        fontSize: 20,
        marginRight: 20,
        alignContent:'stretch',
        //right:10,
    },
    info_Phone:{
        paddingLeft: 10,
        color:'#0000EE',
        textDecorationLine: 'underline',
        fontSize: 20,
    },
    map: {
        height: height*0.334,
    },
    zoomoutmap: {
        top: height*0.29,
        alignSelf: 'flex-end',
        right: 10,
        position: 'absolute', 
    },  
    todayStat: {
        flexDirection: "row",
    },
    todayInfo: {
        flex: 1,
        marginLeft: -230,
        fontSize: 20,
    },
    arrow: {
        right: 10,
        alignItems: 'flex-end',
    },
    weekdayLoop_Header:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
        fontSize: 20,
        flexDirection: "column",
        color:'black',
        fontWeight: 'bold',

    }
});