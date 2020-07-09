import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import moment from 'moment';

import { 
    Row, 
    View, 
    Text, 
    Image, 
    Alert, 
    Caption, 
    Subtitle, 
    FlatList, 
    TextInput, 
    Dimensions, 
    ScrollView, 
    StyleSheet, 
    RefreshControl, 
    ouchableOpacity, 
    ImageBackground, 
    TouchableOpacity,  
    ActivityIndicator, 
    TouchableNativeFeedbackBase, 
} from 'react-native';
import Modal from 'react-native-modal';
import { Icon, List, ListItem, Button } from "react-native-elements";
import { getKernelsForBackend } from '@tensorflow/tfjs';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height
const defaultPhotoUrl = "https://pwcenter.org/sites/default/files/default_images/default_profile.png";

export default class RecommendResultScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            users: [],
            activities: [],
            userLoading: true,
            actLoading: true,
            isJoinMemberShow: false,
        };
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        const userId = this.props.route.params.userId;
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

    renderComeMem(){
        
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
                        <Icon type="ionicon" name="ios-arrow-forward" size={15} color="#000" />
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    toggleJoinMemberScreen = () => {
        this.setState({isJoinMemberShow: !this.state.isJoinMemberShow});
    };

    renderMemberList(){
        //const joinMember = this.getJoinMember(userId);
        const joinMember = this.state.users;
        return(
            <Modal 
                isVisible={this.state.isJoinMemberShow}
                style={styles.modelContainer}
                onBackdropPress={this.toggleJoinMemberScreen}
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

    renderItem = ({ item }) => {
        //console.log(item);
        const itineraryAct = this.getAct(item);
        const { types, name, photos, geometry, formatted_address } = itineraryAct;
        const type = this.getActivityType(types);
        const displayType = this.getActDisplayType(type);
        const startTime = moment(item.startDateTime).format('HH:mm');
        const endTime = moment(item.endDateTime).format('HH:mm');
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

    getAct(activity){
        let itineraryAct = {};
        for(var i=0; i<this.state.activities.length; i++){
            if(activity.place_id == this.state.activities[i].place_id)
                itineraryAct = this.state.activities[i];
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

    async submitToDB(){
        const { goBack } = this.props.navigation;
        const showErrorAlert = () =>
        Alert.alert(
          "Message",
          "已儲存",
          [
            // {
            //   text: "Cancel",
            //   onPress: () => console.log("Cancel Pressed"),
            //   style: "cancel"
            // },
            { text: "OK", onPress: () => { goBack() } }
          ],
          { cancelable: false }
        );

        //const { name, minMember, maxMember, travelMode, joinMember, addActs } = this.state;
        const userId = this.props.route.params.userId;
        const name = this.props.route.params.name;
        const minMember = this.props.route.params.minMember;
        const maxMember = this.props.route.params.maxMember;
        const recommendAct = this.props.route.params.recommendAct;
        const travelMode = this.props.route.params.travelMode;

        const user = firebase.auth().currentUser;
        const date = new Date();
        var groupId = "";
        var itineraryId = "";
        var agenda = [];

        const startDateTime = new Date(recommendAct[0].startDateTime);
        const endDateTime = new Date(recommendAct[recommendAct.length-1].endDateTime);

        recommendAct.forEach((item) => {
            agenda.push({ title: name, summary: item.name, start: item.startDateTime, end: item.endDateTime, fullDay: false, repeat: '', });
        });

        await firebase.firestore()
        .collection('FriendGroup')
        .add({
            admin: firestore.FieldValue.arrayUnion(user.uid),
            createdBy: user.uid,
            groupName: name,
            isCreatedAt: date,
            members: userId,
            photoURL: "",
        })
        .then(ref => {
            groupId = ref.id;
        });


        await firebase.firestore()
        .collection('itineraries')
        .add({
            name: name,
            minMember: minMember,
            maxMember: maxMember,
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            userId: userId,
            activities: recommendAct,
            groupId: groupId,
            travelMode: travelMode,
        })
        .then(ref => {
            itineraryId = ref.id;
        });


        await userId.map((member, i) => (
            firebase
            .firestore()
            .collection('Users')
            .doc(member)
            .update({
                groupId: firestore.FieldValue.arrayUnion(groupId), 
                itineraryId: firestore.FieldValue.arrayUnion(itineraryId), 
                agenda: firestore.FieldValue.arrayUnion(...agenda), 
            })
            .then(ref => {
                showErrorAlert();
            })
        ))
    }

    render(){
        //console.log(this.props.route.params);
        const { userLoading, actLoading } = this.state;
        const recommendAct = this.props.route.params.recommendAct;
        const name = this.props.route.params.name;
        const startDateTime = recommendAct[0].startDateTime;
        const endDateTime = recommendAct[recommendAct.length-1].endDateTime;
        const minMember = this.props.route.params.minMember;
        const maxMember = this.props.route.params.maxMember;
        const mainText = "日程";
        const { goBack } = this.props.navigation;
        const goBackKey = this.props.route.params.goBackKey;

        this.props.navigation.setOptions({
            title:name,
        })
        
        if(!userLoading && !actLoading){
            return(
                <ScrollView style={{flex: 1}}>
                    <View style={styles.infoContainer}>
                        {this.renderEventTime(startDateTime, endDateTime)}
                        {this.renderMemRange(minMember, maxMember)}
                        {this.renderComeMem()}
                    </View>
                    <Text style={styles.mainText}>{mainText}</Text>
                    <FlatList 
                        keyExtractor={this.keyExtractor}
                        style={styles.flatlist}
                        data={recommendAct}
                        renderItem={this.renderItem}
                    />
                    {/* {
                        recommendAct.map((recommend) => (
                            <View>
                                <Text>{recommend.title}</Text>
                            </View>
                        ))
                    } */}
                    {this.renderMemberList()}
                    <View style={{ marginTop: 40, marginHorizontal: 50, marginBottom: 30, }}>
                    <Button 
                        buttonStyle={{borderRadius: 10}}
                        title="儲存"
                        onPress={() => {
                            this.submitToDB();
                            // goBack();
                        }}
                    />
                </View>

                </ScrollView>
            )
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