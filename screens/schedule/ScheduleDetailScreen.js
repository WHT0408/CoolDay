import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import moment from 'moment';

import { 
    View, 
    Text, 
    Alert, 
    Image, 
    FlatList, 
    Dimensions, 
    ScrollView, 
    StyleSheet, 
    RefreshControl, 
    TouchableOpacity, 
    ActivityIndicator, 
} from 'react-native';
import { Icon, List, ListItem, Button } from "react-native-elements";
import Modal from 'react-native-modal';

import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import getDirections from 'react-native-google-maps-directions'
import MapViewDirections from 'react-native-maps-directions';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

const GOOGLE_MAPS_APIKEY = 'AIzaSyBhKUnbXmXD3eXdWP3iHspHFs73E1MjUF0';
const defaultPhotoUrl = "https://pwcenter.org/sites/default/files/default_images/default_profile.png";
var color, letters = '0123456789ABCDEF'.split('');

// await function getPhotoUrl(users){
//     const { id } = users
//     const photoPath = `Users/${id}/profileImage.png`;
//     const photoUrl = await storage()
//     .ref(photoPath)
//     .getDownloadURL();
//     return photoUrl;
// }

export default class ScheduleDetailScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            refreshing: false,
            actLoading: true,
            userLoading: true,
            activities: [],
            users: [],
            userId: '',
            photoUrl: [],
            isJoinMemberShow: false,
            loggedIn: false,
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        const { userId } = this.props.route.params.itinerary;
        var users = [];
        if(userId && userId.length > 0){
            await firebase.firestore()
            .collection('Users')
            .where('__name__', 'in', userId)
            .get()
            .then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                    users = [ ...users, { uid: doc.id, ...doc.data() } ];
                });
            });

            this.setState({
                users: users,
                userLoading: false,
            });
        }

        firebase.database().ref('activities').on('value', (snapshot) => {
            let activities = snapshot.val();
        
            this.setState({
                actLoading: false,
                activities: activities,
            });
        });

        firebase.auth().onUserChanged((user) => {
            if(user){
                this.setState({ loggedIn: true})
            } else {
                this.setState({ loggedIn: false})
            }
        })
        
        // const docRef = firebase.firestore().collection('Users');

        // const { userId } = this.props.route.params.itinerary;
        // var users = [];
        // if(userId && userId.length > 0){
        //     await firebase.firestore()
        //     .collection('Users')
        //     .where('__name__', 'in', userId)
        //     .get()
        //     .then(function(querySnapshot) {
        //         querySnapshot.forEach(function(doc) {
        //             users = [ ...users, { uid: doc.id, ...doc.data() } ];
        //         });
        //     });

        //     this.setState({
        //         users: users,
        //         userLoading: false,
        //     });
        // }

        // firebase.database().ref('activities').on('value', (snapshot) => {
        //     let activities = snapshot.val();
        
        //     this.setState({
        //         actLoading: false,
        //         activities: activities,
        //     });
        // });

    }

    renderEventTime(startDateTime, endDateTime){
        const startDate = moment(startDateTime).format('YYYY年MM月DD日');
        const endDate = moment(endDateTime).format('YYYY年MM月DD日');
        const startTime = moment(startDateTime).format('HH:mm');
        const endTime = moment(endDateTime).format('HH:mm');
        return(
            <View style={styles.infoEachContainer}>
                <View style={styles.startDateTime}>
                    <Text style={styles.startEndText}>開始</Text>
                    <Text style={styles.startEndDate}>{startDate}</Text>
                    <Text style={styles.startEndTime}>{startTime}</Text>
                </View>

                <View style={styles.endDateTime}>
                    <Text style={styles.startEndText}>結束</Text>
                    <Text style={styles.startEndDate}>{endDate}</Text>
                    <Text style={styles.startEndTime}>{endTime}</Text>
                </View>
                
            </View>
        )
    }

    renderMemRange(minMember, maxMember){
        const memRangeText = minMember + " - " + maxMember + " 人";
        return(
            <View style={styles.infoEachContainer}>
                <View style={styles.oneRowTextContainer}>
                    <Text style={styles.oneRowText}>參加人數</Text>
                </View>
                <View style={styles.oneRowContainer}>
                    <Text style={styles.memRange}>{memRangeText}</Text>
                </View>
            </View>
        )
    }

    getUserIconSize(maxShowUser){
        const joinMember = this.state.users;
        var size = maxShowUser * 10 - 10;

        if(joinMember.length == 1)
            size = 0;
        else if(joinMember.length == 2)
            size = 12;
        else if(joinMember.length == 3)
            size = 24;
        else if(joinMember.length == 4)
            size = 36;
        else
            size = 40;

        return size;
    }

    renderComeMem(){
        
        //https://firebasestorage.googleapis.com/v0/b/coolday-2fbca.appspot.com/o/Users%2FTDSXgS0xUkQHBRGnub80Tzi8XPn2%2FprofileImage.png?alt=media&token=9d04513c-5555-4eae-8661-c15260a37cb9

        var userAccount;
        var userIconLoop = [];
        const maxShowUser = 5;
        var size = this.getUserIconSize(maxShowUser);
        var userCount = 0;
        //const joinMember = this.getJoinMember(userId);
        const joinMember = this.state.users;

        for(var i=0; i<joinMember.length; i++){
            if(userCount < maxShowUser){
                if(userCount != maxShowUser-1){
                    const photoURL = joinMember[i].photoURL?joinMember[i].photoURL:defaultPhotoUrl;
                    userIconLoop.push(
                        <View key={i}>
                            <Image 
                                source={{uri: photoURL?photoURL:undefined}}
                                // style={styles.listUserIcon}
                                style={{height: 40, width: 40, borderRadius: 400/ 2, left: size,}}
                            />
                        </View>
                    );
                    size -= 10;
                    userCount++;
                }
                else{
                    const photoURL = joinMember[i].photoURL?joinMember[i].photoURL:defaultPhotoUrl;
                    const otherUserCount = joinMember.length - maxShowUser;
                    const otherUserCountText = "+" + otherUserCount;
                    userIconLoop.push(
                        <View key={i} style={{flexDirection: 'row',alignItems: 'center',}}>
                            <Image 
                                source={{uri: photoURL?photoURL:undefined}}
                                // style={styles.listUserIcon}
                                style={{height: 40, width: 40, borderRadius: 400/ 2, left: size,}}
                            />
                            <Text>{otherUserCountText}</Text>
                        </View>
                    );
                    userCount++;
                }
            }
        }

        return(
            <TouchableOpacity onPress={this.toggleJoinMemberScreen}>
                <View style={styles.infoEachContainer}>
                    <View style={styles.memTextContainer}>
                        <Text style={styles.oneRowText}>誰會來?</Text>
                    </View>
                    <View style={styles.memContainer}>
                        {/* <Text>123</Text> */}
                        <View style={styles.userIconContainer}>
                            {userIconLoop}
                        </View>
                    </View>
                    <View style={styles.memArrowContainer}>
                        <Icon type='ionicon' name="ios-arrow-forward" size={15} color="#000" />
                    </View>
                </View>
            </TouchableOpacity>
        )
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

    handleGetDirections = (itineraryAct, travelMode) => {
        const source_latitude = itineraryAct[0].geometry.location.lat;
        const source_longitude = itineraryAct[0].geometry.location.lng;
        let dest_latitude = "";
        let dest_longitude = "";
        let waypoints = [ ];
        for(var i=0; i<itineraryAct.length; i++){
            if(i != itineraryAct.length-1)
                waypoints.push({ latitude: itineraryAct[i].geometry.location.lat, longitude: itineraryAct[i].geometry.location.lng })
            else{
                dest_latitude = itineraryAct[i].geometry.location.lat;
                dest_longitude = itineraryAct[i].geometry.location.lng;
            }
        }
        console.log(travelMode);
        const data = {
            params: [
                {
                    key: "travelmode",
                    value: travelMode        // "driving", "walking", "bicycling" or "transit"
                },
                {
                    key: "dir_action",
                    value: "navigate"       // this instantly initializes navigation using the given travel mode
                }
            ],

            // source: {
            //     latitude: source_latitude,
            //     longitude: source_longitude,
            // },

            waypoints: waypoints,

            destination: {
                latitude: dest_latitude,
                longitude: dest_longitude,
            },
        }
     
        getDirections(data)
    }

    getRandomColor() {
        color = '#'
        color += letters[Math.round(Math.random() * 5 )];
        for (var i = 0; i < 5; i++) {
            color += letters[Math.round(Math.random() * 15 )];
        }
        return color
    }

    renderMap(activities, name, travelMode) {
        const itineraryAct = this.getActs(activities);

        // let itineraryActivity = [];
        // for(var i=0; i<selectedActivity.length; i++){
        //     itineraryActivity.push(this.state.activities[selectedActivity[i].id]);
        // }
        let points = this.getRegionForCoordinates(itineraryAct);
        var routeLoop = [];
        for (let i = 0; i < itineraryAct.length-1; i++) {
            // var ColorCode = 'rgb(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ')';
            var ColorCode = this.getRandomColor();
            routeLoop.push(
              <View key={i}>
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
                            {/* <Image style={styles.greenflag} source={require('../../image/redflag.png')} /> */}
                        </Marker>
                    </View>
                );
            }
            else{
                var type = this.getActivityType(itineraryAct[i].types);
                if(type == "Eat"){
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
                else if(type == "Play"){
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
                else if(type == "Buy"){
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

        return(
            <View>
                <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                    latitude: points.latitude,
                    longitude: points.longitude,
                    latitudeDelta: points.latitudeDelta,
                    longitudeDelta: points.longitudeDelta,
                    }}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    //scrollEnabled={false}
                    //zoomEnabled={false}
                    // onPress={ () => this.handleGetDirections(itineraryActivity)}
                    // onPress={() => this.props.navigation.navigate("ItineraryMapScreen", {
                    //     itineraryActivity: itineraryActivity,
                    //     name: name
                    // })}
                >

                    <View>
                        {markerLoop}
                        {routeLoop}

                    </View>

                </MapView>
                <Icon
                    name="zoom-out-map" 
                    containerStyle={styles.zoomoutmap} 
                    size={30} 
                    color="#000"
                    onPress={() => this.props.navigation.navigate("ScheduleMapScreen", {
                        itineraryAct: itineraryAct,
                        name: name,
                    })}
                />
                <Icon 
                    name="zoom-out-map" 
                    containerStyle={styles.googlemap} 
                    size={30} 
                    color="rgba(52, 52, 52, 0)"
                    // color = "#000"
                    onPress={ () => this.handleGetDirections(itineraryAct, travelMode)}
                />
                {/* <TouchableOpacity style={styles.googlemap} onPress={ () => this.handleGetDirections(itineraryActivity)}>
                    <Image 
                        style={styles.googlemapimg} 
                        source={require('../../image/black.png')}
                    />
                </TouchableOpacity> */}
            </View>
        );
    }

    getAct(activity){
        let itineraryAct = {};
        for(var i=0; i<this.state.activities.length; i++){
            if(activity.place_id == this.state.activities[i].place_id)
                itineraryAct = this.state.activities[i];
        }
        return itineraryAct;
    }

    getActs(activities){
        let itineraryAct = [];
        for(var i=0; i<activities.length; i++){
            for(var j=0; j<this.state.activities.length; j++){
                if(activities[i].place_id == this.state.activities[j].place_id)
                    itineraryAct.push(this.state.activities[j]);
            }
        }
        return itineraryAct;
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

    getActDisplayType(type){
        let displayType = "";
        if(type=="Eat")
          displayType = "飲食";
        else if(type=="Play")
          displayType = "娛樂";
        else if(type=="Buy")
          displayType = "購物";
        return displayType;
    }

    getImageUrl(photoRef){
        const url = "https://maps.googleapis.com/maps/api/place/photo?";
        const maxwidth = `maxwidth=400`;
        const photoreference = `&photoreference=${photoRef}`;
        const api_key = `&key=AIzaSyBhKUnbXmXD3eXdWP3iHspHFs73E1MjUF0`;
        return `${url}${maxwidth}${photoreference}${api_key}`;
    }

    keyExtractor = (item, index) => index.toString();

    renderItem = ({ item }) => {
        const itineraryAct = this.getAct(item);
        const { types, name, photos, geometry, formatted_address } = itineraryAct;
        const type = this.getActivityType(types);
        const displayType = this.getActDisplayType(type);
        const startTime = moment(item.startDateTime.toDate().toString()).format('HH:mm');
        const endTime = moment(item.endDateTime.toDate().toString()).format('HH:mm');
        const period = startTime + " - " + endTime;
        const image = photos?this.getImageUrl(photos[0].photo_reference):"";


        const title = "【" + displayType + "】" + name;
    

        return(
            <TouchableOpacity  style={styles.listcontainer} onPress={() => this.props.navigation.navigate("EventDetailScreen", {
                activity: itineraryAct,
            })}>
                {/* <Image style={styles.image} source={{ uri: image && image.url ? image.url : undefined  }}>
                </Image> */}
                <Text style={styles.listmaintext}>{period}</Text>
                {/* <Text style={styles.subtitle}>{title}</Text>
                <Text style={styles.caption}>{location.formattedAddress}</Text> */}
                <ListItem
                    title= {title}
                    subtitle={formatted_address}
                    //leftAvatar={{ source: { uri: image?image:undefined } }}
                    leftAvatar = {<View style={styles.center}><Image 
                    source={{uri: image?image:undefined}}
                    style={styles.listImage}
                    /></View>}
                    containerStyle={styles.listcontainerinfo}
                    avatarStyle={{size: 30}}
                    titleStyle={styles.listtitle}
                    subtitleStyle={styles.listsubtitle}
                />
            </TouchableOpacity>
        );
    }

    toggleJoinMemberScreen = () => {
        this.setState({isJoinMemberShow: !this.state.isJoinMemberShow});
    };

    getJoinMember(userId){
        const joinMember = [];
        for(var i=0; i<this.state.users.length; i++){
            for(var j=0; j<userId.length; j++){
                if(this.state.users[i].id == userId[j]){
                    joinMember.push(this.state.users[i]);
                }
            }
        }
        return joinMember;
    }

    renderMemberItem = ({ item }) => {
        const { displayName, firstName, lastName} = item;
        const photoURL = item.photoURL?item.photoURL:defaultPhotoUrl;
        const title = firstName + " " + lastName; 
        return(
            <ListItem
                title= {displayName}
                // subtitle={formatted_address}
                //leftAvatar={{ source: { uri: image?image:undefined } }}
                leftAvatar = {<View style={styles.center}><Image 
                source={{uri: photoURL?photoURL:undefined}}
                style={styles.listUserIcon}
                /></View>}
                containerStyle={styles.memberList}
                avatarStyle={styles.listUserIcon}
                titleStyle={styles.listtitle}
                bottomDivider
                onPress={ () => this.navUserInfo(item) }
                // subtitleStyle={styles.listsubtitle}
            />
        )
    }

    navUserInfo(item){
        this.props.navigation.navigate('UserInfo', { infos: item });
        this.toggleJoinMemberScreen();
    }

    renderMemberList(){
        //const joinMember = this.getJoinMember(userId);
        const joinMember = this.state.users;
        return(
            <Modal 
                isVisible={this.state.isJoinMemberShow}
                style={styles.modelContainer}
                onBackdropPress={this.toggleJoinMemberScreen}
                useNativeDriver={true}
            >
                <View style={{flex: 1}}>
                    <View style={styles.memberTitleContainer}>
                        <Text style={styles.memTitle}>參與者</Text>
                    </View>
                    <View>
                        <FlatList 
                            keyExtractor={this.keyExtractor}
                            style={{height: height*0.8}}
                            data={joinMember}
                            renderItem={this.renderMemberItem}
                        />
                        <Button title="關閉" onPress={this.toggleJoinMemberScreen} />
                    </View>
                    {/* <View style={styles.memListButton}>
                        <Button title="關閉" onPress={this.toggleJoinMemberScreen} />
                    </View> */}
                </View>
            </Modal>
        )
    }

    _onRefresh(){
        this.setState({ refreshing: true, });
        this.initialData().then(() => {
            this.setState({ refreshing: false, });
        });
    }

    joinItinerary(itinerary){
        const user = firebase.auth().currentUser;
        const { name, activities, startDateTime, endDateTime, minMember, maxMember, userId } = itinerary;
        firebase.firestore()
        .collection('itineraries')
        .orderBy('name')
        .startAt(name)
        .get()
        .then(querySnapshot => {
            querySnapshot.forEach(function(doc) {
                var data = { uid: doc.id, ...doc.data() };
                var dataStartDateTimeString = moment(data.startDateTime.toDate().toString()).format('YYYY:MM:DD HH:mm');
                var dataEndDateTimeString = moment(data.endDateTime.toDate().toString()).format('YYYY:MM:DD HH:mm');
                var startDateTimeString = moment(startDateTime).format('YYYY:MM:DD HH:mm');
                var endDateTimeString = moment(endDateTime).format('YYYY:MM:DD HH:mm');
                if(data.activities.length==activities.length && dataStartDateTimeString==startDateTimeString && dataEndDateTimeString==endDateTimeString && data.minMember==minMember && data.maxMember==maxMember && data.userId.length==userId.length){
                    firebase
                    .firestore()
                    .collection('itineraries')
                    .doc(doc.id)
                    .update({
                        userId: firestore.FieldValue.arrayUnion(user.uid),
                    });

                    firebase
                    .firestore()
                    .collection('FriendGroup')
                    .doc(data.groupId)
                    .update({
                        members: firestore.FieldValue.arrayUnion(user.uid),
                    });

                    firebase
                    .firestore()
                    .collection('Users')
                    .doc(user.uid)
                    .update({
                        groupId: firestore.FieldValue.arrayUnion(data.groupId),
                        itineraryId: firestore.FieldValue.arrayUnion(doc.id),
                    });
                }
            });
        });
    }

    render() {
        const { name, activities, startDateTime, endDateTime, minMember, maxMember, userId, travelMode } = this.props.route.params.itinerary;
        const { actLoading, userLoading, loggedIn } = this.state;
        const firstActivityId = activities[0].place_id;
        const mainText = "日程";
        console.log(this.props.route.params.itinerary);
        const showSuccessAlert = () =>
        Alert.alert(
          "Message",
          "已加入!",
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

        if(loggedIn){
            const user = firebase.auth().currentUser;
            if(this.state.users.length >= minMember && this.state.users.length <maxMember && !userId.includes(user.uid)){
                this.props.navigation.setOptions({
                    title:name,
                    headerRight: () => (
                        <Button 
                            buttonStyle={{borderRadius: 10, marginHorizontal: 15, backgroundColor: '#0f0', width: width*0.2}}
                            title="加入"
                            onPress={() => {
                                this.joinItinerary(this.props.route.params.itinerary);
                                showSuccessAlert();
                            }}
                        />
                    ), 
                });
            }
            else{
                this.props.navigation.setOptions({
                    title: name,
                });
            }
        }
        else{
            this.props.navigation.setOptions({
                title: name,
            });
        }

        if(!actLoading && !userLoading){
            return (
                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.refreshing}
                            onRefresh={this._onRefresh.bind(this)}
                        />
                    }
                >
                    {this.renderMap(activities, name, travelMode)}
                    <View style={styles.infoContainer}>
                        {this.renderEventTime(startDateTime, endDateTime)}
                        {this.renderMemRange(minMember, maxMember)}
                        {this.renderComeMem()}
                    </View>
                    <Text style={styles.mainText}>{mainText}</Text>
                    <FlatList 
                        keyExtractor={this.keyExtractor}
                        style={styles.flatlist}
                        data={activities}
                        renderItem={this.renderItem}
                    />
                    {this.renderMemberList()}
                </ScrollView>
            );
        }
        else{
            return <ActivityIndicator />
        }
    }
}

const styles = StyleSheet.create({
    mainText: {
        fontSize: 20,
        marginTop: 20,
        marginHorizontal: 20,
        color: '#000',
        fontWeight: 'bold',
    },
    infoContainer: {
        marginHorizontal: 20,
        // marginTop: 10,

    },
    infoEachContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#D6D7DA',
    },
    startDateTime: {
        width: width*0.45,
        borderRightWidth: 1,
        borderRightColor: '#D6D7DA',
        alignItems: 'center',
        marginVertical: 20,
    },
    endDateTime: {
        width: width*0.45,
        alignItems: 'center',
        marginVertical: 20,
    },
    startEndDate: {
        fontSize: 20,
        color: '#000',
    },
    startEndTime: {
        fontSize: 20,
        color: '#000',
    },
    oneRowTextContainer: {
        width: width*0.30,
        marginVertical: 20,
    },
    oneRowContainer: {
        width: width*0.60,
        alignItems: 'flex-end',
        marginVertical: 20,
    },
    memTextContainer: {
        width: width*0.25,
        marginVertical: 20,
        justifyContent: 'center',
    },
    memContainer: {
        width: width*0.55,
        alignItems: 'flex-end',
        marginVertical: 20,
    },
    memArrowContainer: {
        width: width*0.10,
        alignItems: 'flex-end',
        marginVertical: 20,
        justifyContent: 'center',
    },
    oneRowText: {
        fontSize: 20,
        color: '#000',
        fontWeight: 'bold',
    },
    memRange: {
        fontSize: 20,
        color: '#000',
    },
    listcontainer: {
        margin: 10,
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#d6d7da',
        marginHorizontal: 20,
        backgroundColor: '#fff',
    },
    listcontainerinfo: {
        borderRadius: 12,
        borderWidth: 0,
        borderColor: '#d6d7da',
        backgroundColor: '#fff',
    },
    listmaintext: {
        marginHorizontal: 10,
        fontWeight: 'bold',
        color: '#000',
        fontSize: 18,
    },
    listtitle: {
        fontSize: 16,
        color: '#000',
        // fontWeight: 'bold',
    },
    listsubtitle: {
        marginTop: 5,
        marginLeft: 10,
    },
    image: {
        overflow: 'hidden',
        borderRadius: 8,
        height: 40,
        width: 40,
    },
    map: {
        height: height*0.334,

    },
    greenflag: {
        width: 40,
        height: 40,
    },
    redflag: {
        width: 50,
        height: 50,
    },
    zoomoutmap: {
        // top: 215,
        top: height*0.29,
        alignSelf: 'flex-end',
        right: 10,
        position: 'absolute', 
    },
    googlemap: {
        position: 'absolute', 
        width: 60,
        height: 20,
        left: 5,
        // top: 220,
        top: height*0.30,
    },
    googlemapimg: {
        //position: 'absolute', 
        top: 10,
        left: 5,
        width: 60,
        height: 20,
    },
    listImage: {
        width: 60, 
        height: 60,
        borderRadius: 10,
    },
    center:{
        justifyContent: 'center'
    },
    userIconContainer: {
        flexDirection: 'row',
    },
    listUserIcon: {
        height: 40,
        width: 40,
        borderRadius: 400/ 2,
    },
    memListButton: {
        marginBottom: height*0.01,
        marginRight: width*0.1, 
        marginLeft: width*0.1,
        backgroundColor: '#fff'
    },
    memTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        alignSelf: 'center',
        color: '#000',
        marginVertical: 10,
    },
    modelContainer: {
        // backgroundColor: '#fff',
        flex: 1,
        width: width*0.6,
        height: 20,
        alignSelf: 'center',

    },
    memberList: {

    },
    memberTitleContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
    },
});