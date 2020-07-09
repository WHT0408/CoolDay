import React, { PureComponent, useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text,
    Row,
    ImageBackground,
    Caption,
    Subtitle,
    FlatList,
    ScrollView,
    Dimensions,
    TextInput, 
    ActivityIndicator,
    Image,
    TouchableNativeFeedbackBase,
    Alert,
    RefreshControl,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { CheckBox, ListItem, Button, ButtonGroup, ThemeConsumer } from 'react-native-elements';
import NumericInput from 'react-native-numeric-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import DatePicker from 'react-native-datepicker';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import 'regenerator-runtime/runtime';

import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import * as tf from '@tensorflow/tfjs';
import * as d3 from 'd3';

// import {PythonShell} from 'python-shell';
import axios from 'axios'; 
import { batch } from 'react-redux';
//import { model } from '@tensorflow/tfjs';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height
const defaultPhotoUrl = "https://pwcenter.org/sites/default/files/default_images/default_profile.png";
var url = "https://firebasestorage.googleapis.com/v0/b/coolday-2fbca.appspot.com/o/Test%2Fhobby.txt?alt=media&token=27c05db2-6739-4007-93c0-fc9d9352cd18";
//window.Date = Date;

var recommendResult = [];

let model = undefined;

export default class RecommendScreen extends PureComponent {
    state={
        refreshing: false,
        fdLoading: true,
        userLoading: true,
        actLoading: true,
        groupLoading: true,
        itiLoading: true,

        buttonText: "為您計劃",
        friendId: [],
        groupId: [],
        isTravelModeShow: false,
        isJoinGroupShow: false,
        isJoinMemberShow: false,
        isActScreenShow: false,
        isDialogShow: false,
        users: [],
        groups: [],
        //joinGroup: [],
        joinGroup: "",
        favActId: [],
        activities: [],
        itineraries: [],

        name: '',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1),
        minMember: 1,
        maxMember: 1,
        joinMember: [firebase.auth().currentUser.uid],
        addActs: [],
        travelMode: "driving",

        budget: 50,
        recommendResult: [],

        data: [],
        mlData: [],
    };

    constructor(props){
        super(props);
        this.initialData();
    }

    async initialData() {

        //all user
        const userDocRef = firebase.firestore().collection('Users');

        userDocRef.onSnapshot((snapshot) => {
            var users = [];
            const userInfo = [];
            const photoPath = [];
            snapshot.forEach(doc => {
                // const data = doc.data();
                // const userList = {};
                // userList['id'] = doc.id;
                // userList['infos'] = data;

                // users.push(userList);
                users = [ ...users, { uid: doc.id, ...doc.data() }]
            })
            this.setState({
                users: users,
                userLoading: false,
            });
        });

        //itineraries
        const itiDocRef = firebase.firestore().collection('itineraries');

        itiDocRef.onSnapshot((snapshot) => {
            var itineraries = [];
            snapshot.forEach(doc => {
                // const data = doc.data();
                // const userList = {};
                // userList['id'] = doc.id;
                // userList['infos'] = data;

                // users.push(userList);
                itineraries = [ ...itineraries, { iid: doc.id, ...doc.data() }]
            })
            this.setState({
                itineraries: itineraries,
                itiLoading: false,
            });
        });

        //current user
        const user = firebase.auth().currentUser;

        const fdDocRef = firebase
        .firestore()
        .collection('Users')
        .doc(user.uid);

        data = (await fdDocRef.get()).data();
        var { friendId, groupId, favActId } = data;
        if(friendId==null)
            friendId=[];
        if(groupId==null)
            groupId=[];
        if(favActId==null)
            favActId=[];
        friendId.push(user.uid);

        this.setState({
            groupId: groupId,
            friendId: friendId,
            favActId, favActId,
            fdLoading: false,
        });


        //all group
        const groupDocRef = firebase.firestore().collection('FriendGroup');

        groupDocRef.onSnapshot((snapshot) => {
            var groups = [];
            snapshot.forEach(doc => {
                groups = [ ...groups, { gid: doc.id, ...doc.data() }]
            })
            this.setState({
                groups: groups,
                groupLoading: false,
            });
        });


        //activities
        firebase.database().ref('activities').on('value', (snapshot) => {
            let activities = snapshot.val();
        
            this.setState({
                activities: activities,
                actLoading: false,
            });
        });
    }

    async refreshData() {
        //reset
        this.reset();

        this.initialData();
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
                checkBox={{
                            onPress: () => this.handleMemberPress(item.uid), 
                            checked: this.state.joinMember ? this.state.joinMember.includes(item.uid) : false,
                        }}
                // onPress={ () => this.navUserInfo(item) }
            />
        )
    }

    navUserInfo(item){
        this.props.navigation.navigate('UserInfo', { infos: item });
        this.toggleJoinMemberScreen();
    }

    handleMemberPress = (uid) => {
        const { joinMember } = this.state;
        if (!joinMember.includes(uid)) {
            this.setState({ joinMember: [...joinMember, uid] });
        }
        else {
            this.setState({ joinMember: joinMember.filter(a => a !== uid) });
        }
    }

    renderActList(){
        const favAct = this.getFavAct();
        return(
            <Modal 
                isVisible={this.state.isActScreenShow}
                style={styles.actModelContainer}
                onBackdropPress={this.toggleAddActScreen}
                useNativeDriver={true}
            >
                <View style={{flex: 1}}>
                    <View style={styles.memberTitleContainer}>
                        <Text style={styles.memTitle}>喜歡的活動</Text>
                    </View>
                    <View>
                        <FlatList 
                            keyExtractor={this.keyExtractor}
                            style={{height: height*0.8}}
                            data={favAct}
                            renderItem={this.renderActItem}
                        />
                        <Button title="關閉" onPress={this.toggleAddActScreen} />
                    </View>
                    {/* <View style={styles.memListButton}>
                        <Button title="關閉" onPress={this.toggleJoinMemberScreen} />
                    </View> */}
                </View>
            </Modal>
        )
    }

    getFavAct(){
        const { activities } = this.state;
        const favActId = this.state.favActId?this.state.favActId:[];
        const favAct = [];
        for(var i=0; i<favActId.length; i++){
            for(var j=0; j<activities.length; j++){
                if(activities[j].place_id == favActId[i]){
                    favAct.push(activities[j]);
                }
            }
        }
        return favAct;
    }

    renderActItem = ({ item }) => {
        const { name, geometry, formatted_address, photos, place_id } = item;
        const activityType = this.getActivityType(item);
        const displayType = this.getActivityDisplayType(activityType);
        const title = "【" + displayType + "】" + name;
        const formattedAddress = formatted_address?formatted_address:"";
        const image = photos?this.getImageUrl(photos[0].photo_reference):"";
        return(
            <ListItem
                title= {title}
                subtitle={formatted_address}
                //leftAvatar={{ source: { uri: image?image:undefined } }}
                leftAvatar={<View style={styles.center}><Image 
                      source={{uri: image?image:undefined}}
                      style={styles.listImage}
                    /></View> }
                // containerStyle={styles.memberList}
                avatarStyle={styles.listUserIcon}
                titleStyle={styles.listtitle}
                bottomDivider
                checkBox={{
                            // iconType: 'material', 
                            // checkedIcon: 'clear', 
                            // uncheckedIcon: 'add', 
                            // uncheckedColor:'#0f0', 
                            // checkedColor: '#f00', 
                            onPress: () => this.handleActPress(place_id), 
                            checked: this.state.addActs ? this.state.addActs.some(item => item.place_id == place_id) : false,
                        }}
            />
        )
    }

    handleActPress = (id) => {
        const { addActs, date } = this.state;

        // if (!addActs.includes(id)) {
        //     this.setState({ addActs: [...addActs, id] });
        // }
        // else {
        //     this.setState({ addActs: addActs.filter(a => a !== id) });
        // }
        const year = moment(date).format('YYYY');
        const month = moment(date).format('MM');
        const day = moment(date).format('DD');
        const defaultDateTime = new Date(date);

        for(var i=0; i<this.state.activities.length; i++){
            if(this.state.activities[i].place_id == id){
                if (!addActs.some(item => item.place_id == id)) {
                    this.setState({ 
                        addActs: [
                            ...addActs, 
                            { 
                                ...this.state.activities[i], 
                                startDateTime: defaultDateTime, 
                                endDateTime: defaultDateTime, 
                                startTimeShow: false,
                                endTimeShow: false,
                            }
                        ] 
                    });
                }
                else {
                    this.setState({ addActs: addActs.filter(a => a.place_id !== id) });
                }
            }
        }

        // var activities = [ ...this.state.addActs ];
        // for(var i=0; i<this.state.activities.length; i++){
            
        //     if(this.state.activities[i].place_id == id){
        //         if(!activities.some(item => item.place_id == id)){
        //             var activity = {};
        //             activity['place_id'] = id;
        //             activity['name'] = this.state.activities[i].name;
        //             activity['startDateTime'] = new Date(new Date().getHours(), new Date().getMinutes());
        //             activity['endDateTime'] = new Date(new Date().getHours(), new Date().getMinutes());
        //             activities.push(activity);
        //         }
        //         else{

        //         }
        //     }


        // }
        // this.setState({ addActs: activities });
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

    getActivityDisplayType(type){
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

    renderMemberList(){
        const friendMember = this.getFriendMember();
        return(
            <Modal 
                isVisible={this.state.isJoinMemberShow}
                style={styles.modelContainer}
                onBackdropPress={this.toggleJoinMemberScreen}
                useNativeDriver={true}
            >
                <View style={{flex: 1}}>
                    <View style={styles.memberTitleContainer}>
                        <Text style={styles.memTitle}>請選擇成員</Text>
                    </View>
                    <View>
                        <FlatList 
                            keyExtractor={this.keyExtractor}
                            style={{height: height*0.8}}
                            data={friendMember}
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

    getFriendMember(){
        const friendMember = [];
        for(var i=0; i<this.state.users.length; i++){
            for(var j=0; j<this.state.friendId.length; j++){
                if(this.state.users[i].uid == this.state.friendId[j]){
                    friendMember.push(this.state.users[i]);
                }
            }
        }
        return friendMember;
    }

    keyExtractor = (item, index) => index.toString();

    toggleJoinMemberScreen = () => {
        this.setState({isJoinMemberShow: !this.state.isJoinMemberShow});
    };

    toggleAddActScreen = () => {
        this.setState({isActScreenShow: !this.state.isActScreenShow});
    };

    toggleTravelModeScreen = () => {
        this.setState({isTravelModeShow: !this.state.isTravelModeShow});
    };

    getTravelModeName(value){
        var travelMode = "開車";

        if(value=="driving")
            travelMode = "開車";
        else if(value=="transit")
            travelMode = "大眾運輸";
        else if(value=="walking")
            travelMode = "步行";
        else if(value=="bicycling")
            travelMode = "單車";
        
        return travelMode;

    }

    getGroupName(groupMember){
        var groupName = "";
        for(var i=0; i<groupMember.length; i++){
            if(groupMember[i].gid == this.state.joinGroup){
                groupName = groupMember[i].groupName;
            }
        }
        return groupName;
    }

    renderSurvey(){
        var travelModeText = this.state.travelMode?this.getTravelModeName(this.state.travelMode): "";

        const groupMember = this.getGroupMemberId();
        //console.log(groupMember);
        var joinGroupText = this.state.joinGroup?this.getGroupName(groupMember):"0個群組";

        var joinMemCount = this.state.joinMember?this.state.joinMember.length: 0;
        var joinMemberText = joinMemCount + "位成員";
        var joinMemberStyle = this.isValidMemberNum()?styles.buttonValid:styles.buttonInvalid;

        var addActCount = this.state.addActs?this.state.addActs.length: 0;
        var addActText = addActCount + "個活動";
        var addActStyle = this.isValidActNum()?styles.buttonValid:styles.buttonInvalid;
        //console.log(this.state.addActs);
        //var errorText = this.checkInput();

        const showErrorAlert = () =>
        Alert.alert(
          "Error",
          this.checkInput(),
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

        const showSuccessAlert = () =>
        Alert.alert(
          "Message",
          "成功提交!",
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

        //var selectedAct = this.getSelectedAct();
        return(
            <View style={styles.form}>
                <View style={styles.quesContainer}>
                    <Text style={styles.title}>行程名稱</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder='行程名稱' 
                        onChangeText={name => this.setState({ name })} 
                        value={this.state.name} 
                        blurOnSubmit={ false } 
                        ref={ (input) => { this.name = input; }} 
                        onSubmitEditing={ () => { this.name.blur(); } } 
                    />
                </View>

                <View style={styles.quesContainer}>
                    <Text style={styles.title}>選擇日期</Text>                   
                    <TouchableOpacity 
                        style={{borderWidth: 2, borderColor: '#AEAEAE', borderRadius: 10, width: 200, alignSelf: 'center'}} 
                        onPress={() => {
                            this.setState({
                                dateShow: true,
                                dateTimeMode: 'date',
                            });
                        }}
                    >
                        <Text style={{alignSelf: 'center', fontSize: 20, marginVertical: 10}}>{moment(this.state.date).format('YYYY-MM-DD')}</Text>
                    </TouchableOpacity>
                    {this.state.dateShow && 
                        <DateTimePicker 
                            testID="datePicker"
                            style={{width: 200, alignSelf: 'center'}}
                            minimumDate={new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)}
                            value={this.state.date}
                            mode={this.state.dateTimeMode}
                            onChange={(event, date) => {
                                date = date || this.state.date;
    
                                this.setState({
                                    dateShow: Platform.OS === 'ios' ? true : false,
                                    date: date,
                                });
                            }}
                            is24Hour={true}
                            display="default"
                        />
                    }
                </View>

                <View style={styles.quesContainer}>
                    <Text style={styles.title}>參加人數</Text>
                    <View style={{flexDirection: 'row'}}>
                        <View style={{width: width*0.35}}>
                            <NumericInput 
                                type='plus-minus' 
                                onChange={minMember => this.setState({ minMember })} 
                                initValue={this.state.minMember}
                                value={this.state.minMember}
                                minValue={1}
                                maxValue={this.state.maxMember}
                                valueType='real'
                                rounded 
                                textColor='#000' 
                                iconStyle={{ color: 'white' }} 
                                rightButtonBackgroundColor='#06BA65' 
                                leftButtonBackgroundColor='#0FFE95'
                            />
                            {/* <Text>123</Text> */}
                        </View>

                        <View style={{width: width*0.13, alignItems: 'center', justifyContent: 'center'}}>
                            <Text>至</Text>
                        </View>

                        <View style={{width: width*0.35, alignItems: 'flex-end'}}>
                            <NumericInput 
                                type='plus-minus' 
                                onChange={maxMember => this.setState({ maxMember })}
                                initValue={this.state.maxMember}
                                value={this.state.maxMember}
                                minValue={this.state.minMember}
                                iconSize={25}
                                valueType='real'
                                rounded 
                                textColor='#000' 
                                iconStyle={{ color: 'white' }} 
                                rightButtonBackgroundColor='#06BA65' 
                                leftButtonBackgroundColor='#0FFE95'
                            />
                            {/* <Text>456</Text> */}
                        </View>
                    </View>
                </View>

                <View style={styles.quesContainer}>
                    <Text style={styles.title}>選擇交通</Text>
                    <Button
                        title={travelModeText}
                        titleStyle={{color: '#000'}}
                        buttonStyle={styles.gpButtonValid}
                        onPress={this.toggleTravelModeScreen}
                    />
                </View>

                <View style={styles.quesContainer}>
                    <Text style={styles.title}>選擇群組</Text>
                    <Button
                        title={joinGroupText}
                        titleStyle={{color: '#000'}}
                        buttonStyle={styles.gpButtonValid}
                        onPress={this.toggleJoinGroupScreen}
                    />
                </View>

                <View style={styles.quesContainer}>
                    <Text style={styles.title}>新增成員</Text>
                    <Button
                        title={joinMemberText}
                        titleStyle={{color: '#000'}}
                        buttonStyle={joinMemberStyle}
                        onPress={this.toggleJoinMemberScreen}
                    />
                </View>

                <View style={styles.quesContainer}>
                    <Text style={styles.title}>新增活動</Text>
                    <Button
                        title={addActText}
                        titleStyle={{color: '#000'}}
                        buttonStyle={addActStyle}
                        onPress={this.toggleAddActScreen}
                    />
                </View>

                <View style={styles.quesContainer}>
                    {this.state.addActs.length>0 ? <Text style={styles.title}>活動時間</Text> : null}
                    {
                        this.state.addActs.map((item, index) => (
                            <View>
                                <View style={{borderWidth: 2, borderRadius: 16, marginTop: 5, marginBottom: 20 }}>
                                    <ListItem
                                        title={`${index+1}. ${item.name}`}
                                        // subtitle={formattedAddress}
                                        // leftAvatar={<View style={styles.center}><Image 
                                        //             source={{uri: image?image:undefined}}
                                        //             style={styles.listImage}
                                        //             /></View> }
                                        containerStyle={styles.listcontainer}
                                        titleStyle={styles.actTimeTitle}
                                        // subtitleStyle={styles.listsubtitle}
                                        bottomDivider
                                        // chevron
                                        // onPress={() => this.props.navigation.navigate("EventDetailScreen", {
                                        // activity: item,
                                        // })}
                                    />

                                    <View style={{flexDirection: 'row', alignSelf: 'center'}}>
                                        <View style={{borderWidth: 2, borderColor: '#AEAEAE', borderRadius: 10, width: width*0.25, margin: 20}}>
                                            <TouchableOpacity 
                                                style={{}} 
                                                onPress={ () => {
                                                    var addActs = [ ...this.state.addActs ];
                                                    addActs[index].startTimeShow = true;

                                                    this.setState({
                                                        addActs: addActs,
                                                        dateTimeMode: 'time',
                                                    })
                                                }}
                                            >
                                                <Text style={{alignSelf: 'center', fontSize: 15, marginVertical: 10}}>{moment(item.startDateTime).format('HH:mm')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {this.state.addActs[index].startTimeShow && 
                                            <DateTimePicker 
                                                testID={`startTimePicker${index}`}
                                                style={{width: 200, alignSelf: 'center'}}
                                                value={item.startDateTime}
                                                mode={this.state.dateTimeMode}
                                                onChange={(event, time) => {
                                                    time = time || item.startDateTime;
                                                    
                                                    var addActs = [ ...this.state.addActs ];
                                                    addActs[index].startDateTime = time;
                                                    addActs[index].startTimeShow = Platform.OS === 'ios' ? true : false;

                                                    this.setState({
                                                        addActs: addActs,
                                                    });
                                                }}
                                                is24Hour={true}
                                                display="default"
                                            />
                                        }
                                        

                                        <View style={{alignItems: 'center', justifyContent: 'center', width: width*0.1 }}>
                                            <Text style={{fontSize: 15}}> 至 </Text>
                                        </View>

                                        <View style={{borderWidth: 2, borderColor: '#AEAEAE', borderRadius: 10, width: width*0.25, margin: 20, alignSelf: 'flex-end'}}>
                                            <TouchableOpacity 
                                                style={{}} 
                                                onPress={ () => {
                                                    var addActs = [ ...this.state.addActs ];
                                                    addActs[index].endTimeShow = true;

                                                    this.setState({
                                                        addActs: addActs,
                                                        dateTimeMode: 'time',
                                                    })
                                                }}
                                            >
                                                <Text style={{alignSelf: 'center', fontSize: 15, marginVertical: 10}}>{moment(item.endDateTime).format('HH:mm')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {this.state.addActs[index].endTimeShow &&
                                            <DateTimePicker 
                                                testID={`endTimePicker${index}`}
                                                style={{width: 200, alignSelf: 'center'}}
                                                value={item.endDateTime}
                                                mode={this.state.dateTimeMode}
                                                onChange={(event, time) => {
                                                    time = time || item.endDateTime;
                                                    
                                                    var addActs = [ ...this.state.addActs ];
                                                    addActs[index].endDateTime = time;
                                                    addActs[index].endTimeShow = Platform.OS === 'ios' ? true : false;

                                                    this.setState({
                                                        addActs: addActs,
                                                    });
                                                }}
                                                is24Hour={true}
                                                display="default"
                                            />
                                        }
                                    </View>
                                </View>
                            </View>
                        ))
                    }
                </View>

                <View style={styles.quesContainer, {marginTop: 40}}>
                    <Button 
                        buttonStyle={{borderRadius: 10}}
                        title="提交"
                        onPress = {() => {
                            this.checkInput();
                            {this.checkInput()==""?this.submitToDB():null}
                            {this.checkInput()==""?showSuccessAlert():showErrorAlert()}
                        }}
                    />
                </View>

            </View>
        )
    }

    checkInput(){
        var result = "";
        const { name, date, minMember, maxMember, joinMember, addActs } = this.state;
        //console.log(addActs);
        if(!name || joinMember.length==0 || addActs.length==0){
            var count = 0;
            if(!name){
                if(count == 0)
                    result += "行程名稱";
                else
                    result += "、行程名稱";
                count++;
            }
            if(joinMember.length==0){
                if(count == 0)
                    result += "成員";
                else
                    result += "、成員";
                count++;
            }
            if(addActs.length==0){
                if(count == 0)
                    result += "活動";
                else
                    result += "、活動";
                count++;
            }
            result += "不能為空!\n";  
        }


        if(!this.isValidMemberNum()){
            result += "成員與參加人數不符!\n";
        }

        for(var i=0; i<addActs.length; i++){
            if(addActs[i].endDateTime <= addActs[i].startDateTime){
                result += addActs[i].name + "的開始時間應早於完結時間!\n";
            }
            if(i>0 && addActs[i].startDateTime <= addActs[i-1].endDateTime){
                result += addActs[i-1].name + "的完結時間應早於" + addActs[i].name + "的開始時間!\n";
            }
        }

        return result;
    }

    async submitToDB(){
        const { name, minMember, maxMember, travelMode, joinMember, addActs } = this.state;
        var agenda = [];

        addActs.forEach((item) => {
            agenda.push({ title: name, summary: item.name, start: item.startDateTime, end: item.endDateTime, fullDay: false, repeat: '', });
        });
        
        var activities = [ ...addActs ];
        activities = activities.map(function({place_id, startDateTime, endDateTime}){
            return {place_id, startDateTime, endDateTime};
        })
    
        const user = firebase.auth().currentUser;
        const date = new Date();
        var groupId = "";
        var itineraryId = "";

        await firebase.firestore()
        .collection('FriendGroup')
        .add({
            admin: firestore.FieldValue.arrayUnion(user.uid),
            createdBy: user.uid,
            groupName: name,
            isCreatedAt: date,
            members: joinMember,
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
            startDateTime: addActs[0].startDateTime,
            endDateTime: addActs[addActs.length-1].endDateTime,
            userId: joinMember,
            activities: activities,
            groupId: groupId,
            travelMode: travelMode,
        })
        .then(ref => {
            itineraryId = ref.id;
        });


        await joinMember.map((member, i) => (
            firebase
            .firestore()
            .collection('Users')
            .doc(member)
            .update({
                groupId: firestore.FieldValue.arrayUnion(groupId),
                itineraryId: firestore.FieldValue.arrayUnion(itineraryId),
                agenda: firestore.FieldValue.arrayUnion(...agenda),
            })
        ))

        this.reset();
    }

    toggleJoinGroupScreen = () => {
        this.setState({isJoinGroupShow: !this.state.isJoinGroupShow});
    };

    isValidMemberNum(){
        var isValid = false;
        var joinMemberLen = this.state.joinMember?this.state.joinMember.length:0;
        var { minMember, maxMember } = this.state;
        if(joinMemberLen>=minMember && joinMemberLen<=maxMember){
            isValid = true;
        }
        return isValid;
    }

    isValidActNum(){
        var isValid = false;
        if(this.state.addActs.length > 0){
            isValid = true;
        }
        return isValid;
    }

    toggleJoinMemberScreen = () => {
        this.setState({isJoinMemberShow: !this.state.isJoinMemberShow});
    };

    renderTitle(){
        return(
            <View style={styles.greetContainter}>
                <Text style={styles.greeting}>{'新增行程'}</Text>
            </View>
        )
    }

    renderTravelModeList(){
        const travelMode = [
            {
                name: "開車",
                value: "driving"
            },
            {
                name: "大眾運輸",
                value: "transit"
            },
            {
                name: "步行",
                value: "walking"
            },
            {
                name: "單車",
                value: "bicycling"
            },
        ];
        return(
            <Modal 
                isVisible={this.state.isTravelModeShow}
                style={styles.modelContainer}
                onBackdropPress={this.toggleTravelModeScreen}
                useNativeDriver={true}
            >
                <View style={{flex: 1}}>
                    <View style={styles.memberTitleContainer}>
                        <Text style={styles.memTitle}>請選擇群組</Text>
                    </View>
                    <View>
                        <FlatList 
                            keyExtractor={this.keyExtractor}
                            style={{height: height*0.8}}
                            data={travelMode}
                            renderItem={this.renderTravelModeItem}
                        />
                        <Button title="關閉" onPress={this.toggleTravelModeScreen} />
                    </View>
                </View>
            </Modal>
        )
    }

    renderTravelModeItem = ({ item }) => {
        return(
            <ListItem
                title= {item.name}
                containerStyle={styles.memberList}
                titleStyle={styles.listtitle}
                bottomDivider
                checkBox={{
                            onPress: () => this.handleTravelModePress(item), 
                            checked: this.state.travelMode ? this.state.travelMode == item.value : false,
                        }}
            />
        )
    }

    handleTravelModePress = (item) => {
        var { travelMode } = this.state;

        // if (!travelMode.includes(item.value)) {
        //     this.setState({ travelMode: [...travelMode, item.value] });
        // }
        // else {
        //     this.setState({ travelMode: travelMode.filter(a => a !== item.value) });
        // }


        if (travelMode != item.value) {
            this.setState({ travelMode: item.value });
        }
    }

    renderGroupList(){
        const groupMember = this.getGroupMemberId();
        const groupName = [];
        for(var i=0; i<groupMember.length; i++){
            groupName.push(groupMember[i].groupName);
        }
        return(
            <Modal 
                isVisible={this.state.isJoinGroupShow}
                style={styles.modelContainer}
                onBackdropPress={this.toggleJoinGroupScreen}
                useNativeDriver={true}
            >
                <View style={{flex: 1}}>
                    <View style={styles.memberTitleContainer}>
                        <Text style={styles.memTitle}>請選擇群組</Text>
                    </View>
                    <View>
                        <FlatList 
                            keyExtractor={this.keyExtractor}
                            style={{height: height*0.8}}
                            data={groupMember}
                            renderItem={this.renderGroupItem}
                        />
                        <Button title="關閉" onPress={this.toggleJoinGroupScreen} />
                    </View>
                </View>
            </Modal>
        )
    }
    
    getGroupMemberId(){
        
        const groupMember = [];
        for(var i=0; i<this.state.groups.length; i++){
            for(var j=0; j<this.state.groupId.length; j++){
                if(this.state.groups[i].gid == this.state.groupId[j]){
                    groupMember.push(this.state.groups[i]);
                }
            }
        }
        return groupMember;
    }

    renderGroupItem = ({ item }) => {
        const { groupName } = item;
        const photoURL = item.photoURL?item.photoURL:defaultPhotoUrl;
        return(
            <ListItem
                title= {groupName}
                containerStyle={styles.memberList}
                avatarStyle={styles.listUserIcon}
                titleStyle={styles.listtitle}
                bottomDivider
                checkBox={{
                            onPress: () => this.handleGroupPress(item), 
                            checked: this.state.joinGroup ? this.state.joinGroup == item.gid : false,
                        }}
            />
        )
    }

    handleGroupPress = (item) => {
        var { joinGroup } = this.state;

        var joinMember = this.state.joinMember;

        if (joinGroup != item.gid) {
            joinMember = [firebase.auth().currentUser.uid];
            for(var i=0; i<item.members.length; i++){
                var uid = item.members[i];
                if(!joinMember.includes(uid)){
                    joinMember.push(uid);
                }
            }
            this.setState({
                joinGroup: item.gid,
                joinMember: joinMember,
            });
        }

        //this.setState({ joinMember: joinMember });
    }

    _onRefresh(){
        this.setState({ refreshing: true, });
        this.refreshData().then(() => {
            this.setState({ refreshing: false, });
        });
    }

    reset = () => {
        this.setState({
            name: '',
            date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1),
            minMember: 1,
            maxMember: 1,
            joinGroup: "",
            joinMember: [firebase.auth().currentUser.uid],
            addActs: [],
            budget: 50,
            buttonText: "為您計劃",
            recommendResult: [],
        });
        model = undefined;
    }

    getGroupUserData(data, mlData){
        const groupMember = this.getGroupMemberId();
        //console.log(groupMember);

        var groupMemberList = [];
        groupMember.filter(a => a.gid == this.state.joinGroup).forEach(groupmember => {
            groupMemberList = [...groupmember.members];
        })
        //console.log(groupMemberList);

        var groupData = {actTypes: data.actTypes.map( () => 0 ), rating: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ratingMinMax: [ 1, 0 ]};
        groupMemberList.forEach(groupmemberlist => {   
            const users = groupmemberlist;
            const { actTypes, rating, ratingMinMax } = mlData.userData[users];

            //calculate total actTypes of all group members
            actTypes.forEach((acttypes, i) => {
                groupData.actTypes[i] += acttypes;
            })

            //calculate total rating of all group member
            rating.forEach((r, i) => {
                groupData.rating[i] += r;
            })

            //get all group members ratingMinMax
            if (groupData.ratingMinMax[0] > ratingMinMax[0]){
                groupData.ratingMinMax[0] = ratingMinMax[0];
            }
            if (groupData.ratingMinMax[1] < ratingMinMax[1]){
                groupData.ratingMinMax[1] = ratingMinMax[1];
            }

        });

        //calculate all group members actTypes
        groupData.actTypes.forEach((acttypes, i) => {
            groupData.actTypes[i] = groupData.actTypes[i] / groupMemberList.length;
        })

        //calculate all group members rating
        groupData.rating.forEach((r, i) => {
            groupData.rating[i] = groupData.rating[i] / groupMemberList.length;
        })

        return groupData;
    }

    getNearestAvailableDate() {
        // Get the nearest available date of user(s)
        const { users, joinGroup, } = this.state; 
        const memberList = (joinGroup) ? this.getGroupMemberId().find(grp => grp.gid === joinGroup).members : [ firebase.auth().currentUser.uid ]; 
        let notfind = true, date = moment().add(1, 'days'), dateList = { 'weekdays':[], 'weekly':[], 'monthly':[], '':[] };

        if(memberList && memberList.length){
            memberList.forEach((memberId, index) => {
                let user = users.find(user => user.uid === memberId);
                if(user && user.agenda && user.agenda.length) {
                    user.agenda.forEach((item) => {
                        dateList[item.repeat].push({ start: moment(item.start.toDate()), end: moment(item.end.toDate()), });
                    });
                }
            });
            dateList['weekdays'] = dateList['weekdays'].sort((a, b) => ((a.start.isBefore(b.start)) ? -1 : 1 ));
            dateList['weekly'] = dateList['weekly'].sort((a, b) => ((a.start.isBefore(b.start)) ? -1 : 1 ));
            dateList['monthly'] = dateList['monthly'].sort((a, b) => ((a.start.isBefore(b.start)) ? -1 : 1 ));
            dateList[''] = dateList[''].sort((a, b) => ((a.start.isBefore(b.start)) ? -1 : 1 ));
        }

        while ( notfind ) {
            if (dateList[''].find((occupied) => ( date.isBetween(occupied.start, occupied.end, 'date', '[]') ))) {
                date.add(1, 'days');
                continue;
            } else if (dateList['weekly'].find((occupied) => ( date.weekday() === occupied.start.weekday() && date.isBetween(occupied.start, occupied.end, 'date', '[]')))) {
                date.add(1, 'days');
                continue;
            } else if (dateList['monthly'].find((occupied) => ( date.date() === occupied.start.date() && date.isBetween(occupied.start, occupied.end, 'date', '[]')))) {
                date.add(1, 'days');
                continue;
            } else if ( dateList['weekdays'].find((occupied) => (!(date.weekday() === 0 || date.weekday() === 6) && date.isBetween(occupied.start, occupied.end, 'date', '[]')))) {
                date = date.add(6 - date.weekday(), 'days');
            } else {
                notfind = false;
            }
        }
        
        return date.format('YYYY-MM-DD');
    }

    async runML(data, mlData){
        this.setState({
            buttonText: <ActivityIndicator style={{height:100, width: 100}}/>,
        });

        //const date = '2020-10-01';
        const date = this.getNearestAvailableDate();
        //console.log(date);


        const { joinMember } = this.state;

        const { users, itineraries } = this.state;
        // const ratings = [];

        const currentUserId = firebase.auth().currentUser.uid;
        var currentName;

        var minMember = 1;
        var maxMember = 5;

        var travelMode;

        var allMemberTPList = [];
        var startEndStats = [ new Date(date + " 23:59"), new Date(date + " 00:00") ];

        //each user rating record
        users.map(user => {
            
            var allTransportList = [];
            // var allFavActList = [];
            // var favActList = [];
            const { uid } = user;
            var itineraryId = user.itineraryId?user.itineraryId:[];
            var transport = user.preference && user.preference.transport?user.preference.transport:[];
            

            //add preference transport record to list
            allTransportList = [...allTransportList, ...transport];


            var memberStats = [ 1, 5 ];
            //console.log(startEndStats);

            // var itiActList = [];
            var transportList = [];
            itineraryId.forEach(iid => {
                itineraries.filter(a => a.iid == iid).forEach(itinerary => {
                    //get user min and max itinerary join member count
                    if (memberStats[0] > itinerary.minMember) memberStats[0] = itinerary.minMember;
                    if (memberStats[1] < itinerary.maxMember) memberStats[1] = itinerary.maxMember;
                    //console.log(itinerary.name, itinerary.startDateTime);

                    //get stats of start and end time
                    if(!this.state.joinGroup){
                        if(uid == currentUserId){
                            const startTimeString = date + " " + moment(itinerary.startDateTime.toDate().toString()).format('HH:mm');
                            const endTimeString = date + " " + moment(itinerary.endDateTime.toDate().toString()).format('HH:mm');
                            const startTime = new Date(startTimeString);
                            const endTime = new Date(endTimeString);
                            //console.log(uid, startTime, endTime);
                            if (startEndStats[0] > startTime) startEndStats[0] = startTime;
                            if (startEndStats[1] < endTime) startEndStats[1] = endTime;
                            //console.log(startEndStats);
                        }
                    }
                    else{
                        const groupMember = this.getGroupMemberId();
                        groupMember.filter(a => a.gid == this.state.joinGroup).forEach(groupmember => {
                            if(groupmember.members.includes(uid)){
                                const startTimeString = date + " " + moment(itinerary.startDateTime.toDate().toString()).format('HH:mm');
                                const endTimeString = date + " " + moment(itinerary.endDateTime.toDate().toString()).format('HH:mm');
                                const startTime = new Date(startTimeString);
                                const endTime = new Date(endTimeString);
                                //console.log(uid, startTime, endTime);
                                if (startEndStats[0] > startTime) startEndStats[0] = startTime;
                                if (startEndStats[1] < endTime) startEndStats[1] = endTime;
                                //console.log(uid, startEndStats[0], startEndStats[1]);
                            }
                        })
                    }


                    //add all itineraries transport records to list
                    transportList.push(itinerary.travelMode);


                });
            });
            // allFavActList = [...allFavActList, ...itiActList];
            allTransportList = [...allTransportList, ...transportList];
            //console.log(uid, allTransportList);
            //console.log(memberStats);

            //get current name & min max member count
            if(uid == currentUserId){
                if(!this.state.joinGroup){
                    //get current user name
                    currentName = user.displayName;

                    //calculate min and max member of current user
                    const midMember = Math.floor( ( memberStats[0] + memberStats[1] ) / 2 );

                    //minMember = Math.floor(Math.random() * (midMember - memberStats[0])) + memberStats[0];
                    minMember = 1;
                    maxMember = Math.floor(Math.random() * (memberStats[1] - midMember)) + midMember;

                    //get travelMode
                    travelMode = allTransportList[Math.floor(Math.random() * allTransportList.length)];
                }
                else{
                    //get current user name
                    const groupMember = this.getGroupMemberId();
                    var groupName = this.getGroupName(groupMember);
                    currentName = groupName;

                    //calculate min and max member of current user
                    const midMember = joinMember.length;
                    minMember = Math.floor(Math.random() * (midMember - 1)) + 1;
                    if(memberStats[1] > joinMember.length){
                        //console.log('run');
                        maxMember = Math.floor(Math.random() * (memberStats[1] - midMember)) + midMember;
                    }
                    else{
                        const max = joinMember.length + joinMember.length;
                        maxMember = Math.floor(Math.random() * (max - midMember)) + midMember;
                    }
                }
            }


            if(this.state.joinGroup){
                //gather all member transport records
                const groupMember = this.getGroupMemberId();
                groupMember.filter(a => a.gid == this.state.joinGroup).forEach(groupmember => {
                    if(groupmember.members.includes(uid)){
                        allMemberTPList = [...allMemberTPList, ...allTransportList];
                    }
                })
            }

        });
        //console.log(rating);
        
        if(this.state.joinGroup){
            travelMode = allMemberTPList[Math.floor(Math.random() * allMemberTPList.length)];
            //console.log(allMemberTPList);
        }
        if(!travelMode){
            travelMode = "driving";
        }
        //console.log(travelMode);

        //get start end time
        if(moment(startEndStats[0]).format('YYYY-MM-DD HH:mm') == (date + " 23:59") && moment(startEndStats[1]).format('YYYY-MM-DD HH:mm') == (date + " 00:00")){
            const zero = Math.floor(Math.random() * (7 - 6)) + 6;
            const one = Math.floor(Math.random() * (23 - 22)) + 22;
            startEndStats[0] = new Date(date + " 0" + zero + ":00");
            startEndStats[1] = new Date(date + " " + one + ":00");
        }
        const minStartTime = parseInt(moment(startEndStats[0]).format('HHmm'));
        const maxEndTime = parseInt(moment(startEndStats[1]).format('HHmm'));
        const midTime = (minStartTime + maxEndTime) / 2;

        console.log(minStartTime + " - " + midTime);
        console.log(midTime + " - " + maxEndTime);
        console.log("user history: " + minStartTime + " - " + maxEndTime);

        const minTimeResult = Math.round((Math.floor(Math.random() * (midTime - minStartTime)) + minStartTime) / 100) * 100;
        const maxTimeResult = Math.round((Math.floor(Math.random() * (maxEndTime - midTime)) + midTime) / 100) * 100;

        console.log("result: " + minTimeResult + " - " + maxTimeResult);

        var restaurantNumStats = 0;

        //get breakfast, lunch, dinner start end time
        var breakfastStats = [0, 0];
        var lunchStats = [0, 0];
        var dinnerStats = [0, 0];

        if(minTimeResult < 900){
            restaurantNumStats += 1;
            const zero = Math.round((Math.floor(Math.random() * (800 - 700)) + 700) / 100) * 100;
            const one = zero==700?800:900;
            breakfastStats[0] = new Date(date + " " + zero.toString().slice(0, zero.toString().length-2) + ":00");
            breakfastStats[1] = new Date(date + " " + one.toString().slice(0, one.toString().length-2) + ":00");
        }
        if(maxTimeResult > 1900){
            restaurantNumStats += 1;
            const zero = Math.round((Math.floor(Math.random() * (2000 - 1900)) + 1900) / 100) * 100;
            const one = zero==1900?2000:2100;
            dinnerStats[0] = new Date(date + " " + zero.toString().slice(0, zero.toString().length-2) + ":00");
            dinnerStats[1] = new Date(date + " " + one.toString().slice(0, one.toString().length-2) + ":00");
        }
        if(minTimeResult < 1400 && maxTimeResult > 1200){
            restaurantNumStats += 1;
            const zero = Math.round((Math.floor(Math.random() * (1300 - 1200)) + 1200) / 100) * 100;
            const one = zero==1200?1300:1400;
            lunchStats[0] = new Date(date + " " + zero.toString().slice(0, zero.toString().length-2) + ":00");
            lunchStats[1] = new Date(date + " " + one.toString().slice(0, one.toString().length-2) + ":00");
        }

        //console.log("rest num: " + restaurantNumStats);
        //console.log(breakfastStats, lunchStats, dinnerStats);
        
        const minDateTime = new Date(date + " " + minTimeResult.toString().slice(0, minTimeResult.toString().length-2) + ":00");
        const maxDateTime = new Date(date + " " + maxTimeResult.toString().slice(0, maxTimeResult.toString().length-2) + ":00");


        //get each time slot activities number
        var timeSlotActNumStats = [0, 0, 0, 0];
        var actDateTime = [];

        if(breakfastStats[0] != 0){
            timeSlotActNumStats = [0, 0, 0, 0];
            const diffTime = Math.abs(breakfastStats[0] - minDateTime);
            const diffHours = Math.ceil(diffTime / (1000*60*60));
            //console.log(diffHours);
            timeSlotActNumStats[0] = Math.floor(diffHours/3);
            //console.log(timeSlotActNumStats);

            var tempStartDateTime = new Date(minDateTime); 
            var tempEndDateTime = new Date(minDateTime); 
            for(var i=0; i<Math.floor(diffHours/3); i++){
                var randomHours = Math.round((Math.random() * (3 - 1)) + 1);

                var actDateTimeList = {};
                actDateTimeList['Location'] = 'BB';
                if(i==0)    
                    actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                else
                    actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                actDateTime.push(actDateTimeList);
            }
            //console.log(actDateTime);

            if(lunchStats[0] != 0){
                timeSlotActNumStats = [timeSlotActNumStats[0], 0, 0, 0];
                const diffTime = Math.abs(lunchStats[0] - breakfastStats[1]);
                const diffHours = Math.ceil(diffTime / (1000*60*60));
                //console.log(diffHours);
                timeSlotActNumStats[1] = Math.floor(diffHours/3);
                //console.log(timeSlotActNumStats);

                var tempStartDateTime = new Date(breakfastStats[1]); 
                var tempEndDateTime = new Date(breakfastStats[1]); 
                for(var i=0; i<Math.floor(diffHours/3); i++){
                    var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
    
                    var actDateTimeList = {};
                    actDateTimeList['Location'] = 'BL';
                    if(i==0)    
                        actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                    else
                        actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                    actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                    actDateTime.push(actDateTimeList);
                }
                //console.log(actDateTime);

                if(dinnerStats[0] != 0){
                    timeSlotActNumStats = [timeSlotActNumStats[0], timeSlotActNumStats[1], 0, 0];
                    const diffTime = Math.abs(dinnerStats[0] - lunchStats[1]);
                    const diffHours = Math.ceil(diffTime / (1000*60*60));
                    //console.log(diffHours);
                    timeSlotActNumStats[2] = Math.floor(diffHours/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime = new Date(lunchStats[1]); 
                    var tempEndDateTime = new Date(lunchStats[1]); 
                    for(var i=0; i<Math.floor(diffHours/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'LD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                        actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);

                    const diffTime2 = Math.abs(maxDateTime - dinnerStats[1]);
                    const diffHours2 = Math.ceil(diffTime2 / (1000*60*60));
                    //console.log(diffHours2);
                    timeSlotActNumStats[3] = Math.floor(diffHours2/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime2 = new Date(dinnerStats[1]); 
                    var tempEndDateTime2 = new Date(dinnerStats[1]); 
                    for(var i=0; i<Math.floor(diffHours2/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'DD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime2);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime2.setHours(tempStartDateTime2.getHours()+3));
                        if(i!=Math.floor(diffHours2/3)-1)
                            actDateTimeList['endDateTime'] = new Date(tempEndDateTime2.setHours(tempStartDateTime2.getHours()+randomHours));
                        else
                            actDateTimeList['endDateTime'] = new Date(maxDateTime);
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);
                }
                else{
                    timeSlotActNumStats = [timeSlotActNumStats[0], timeSlotActNumStats[1], 0];
                    const diffTime = Math.abs(maxDateTime - lunchStats[1]);
                    const diffHours = Math.ceil(diffTime / (1000*60*60));
                    //console.log(diffHours);
                    timeSlotActNumStats[2] = Math.floor(diffHours/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime = new Date(lunchStats[1]); 
                    var tempEndDateTime = new Date(lunchStats[1]); 
                    for(var i=0; i<Math.floor(diffHours/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'LLD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                        if(i!=Math.floor(diffHours/3)-1)
                            actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                        else
                            actDateTimeList['endDateTime'] = new Date(maxDateTime);
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);
                }
            }
            else{
                if(dinnerStats[0] != 0){
                    timeSlotActNumStats = [timeSlotActNumStats[0], 0, 0];
                    const diffTime = Math.abs(dinnerStats[0] - breakfastStats[1]);
                    const diffHours = Math.ceil(diffTime / (1000*60*60));
                    //console.log(diffHours);
                    timeSlotActNumStats[1] = Math.floor(diffHours/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime = new Date(breakfastStats[1]); 
                    var tempEndDateTime = new Date(breakfastStats[1]); 
                    for(var i=0; i<Math.floor(diffHours/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'BD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                        actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);

                    const diffTime2 = Math.abs(maxDateTime - dinnerStats[1]);
                    const diffHours2 = Math.ceil(diffTime2 / (1000*60*60));
                    //console.log(diffHours2);
                    timeSlotActNumStats[2] = Math.floor(diffHours2/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime2 = new Date(dinnerStats[1]); 
                    var tempEndDateTime2 = new Date(dinnerStats[1]); 
                    for(var i=0; i<Math.floor(diffHours2/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'DD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime2);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime2.setHours(tempStartDateTime2.getHours()+3));
                        if(i!=Math.floor(diffHours2/3)-1)
                            actDateTimeList['endDateTime'] = new Date(tempEndDateTime2.setHours(tempStartDateTime2.getHours()+randomHours));
                        else
                            actDateTimeList['endDateTime'] = new Date(maxDateTime);
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);
                }
                else{
                    timeSlotActNumStats = [timeSlotActNumStats[0], 0];
                    const diffTime = Math.abs(maxDateTime - breakfastStats[1]);
                    const diffHours = Math.ceil(diffTime / (1000*60*60));
                    //console.log(diffHours);
                    timeSlotActNumStats[1] = Math.floor(diffHours/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime = new Date(breakfastStats[1]); 
                    var tempEndDateTime = new Date(breakfastStats[1]); 
                    for(var i=0; i<Math.floor(diffHours/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'BBD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                        if(i!=Math.floor(diffHours/3)-1)
                            actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                        else
                            actDateTimeList['endDateTime'] = new Date(maxDateTime);
                        actDateTime.push(actDateTimeList);
                    }
                }
            }
        }
        else{
            if(lunchStats[0] != 0){
                timeSlotActNumStats = [0, 0, 0];
                const diffTime = Math.abs(lunchStats[0] - minDateTime);
                const diffHours = Math.ceil(diffTime / (1000*60*60));
                //console.log(diffHours);
                timeSlotActNumStats[0] = Math.floor(diffHours/3);
                //console.log(timeSlotActNumStats);

                var tempStartDateTime = new Date(minDateTime); 
                var tempEndDateTime = new Date(minDateTime); 
                for(var i=0; i<Math.floor(diffHours/3); i++){
                    var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
    
                    var actDateTimeList = {};
                    actDateTimeList['Location'] = 'LLB';
                    if(i==0)    
                        actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                    else
                        actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                    actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                    actDateTime.push(actDateTimeList);
                }
                //console.log(actDateTime);

                if(dinnerStats[0] != 0){
                    timeSlotActNumStats = [timeSlotActNumStats[0], 0, 0];
                    const diffTime = Math.abs(dinnerStats[0] - lunchStats[1]);
                    const diffHours = Math.ceil(diffTime / (1000*60*60));
                    //console.log(diffHours);
                    timeSlotActNumStats[1] = Math.floor(diffHours/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime = new Date(lunchStats[1]); 
                    var tempEndDateTime = new Date(lunchStats[1]); 
                    for(var i=0; i<Math.floor(diffHours/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'LD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                        actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);

                    const diffTime2 = Math.abs(maxDateTime - dinnerStats[1]);
                    const diffHours2 = Math.ceil(diffTime2 / (1000*60*60));
                    //console.log(diffHours2);
                    timeSlotActNumStats[2] = Math.floor(diffHours2/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime2 = new Date(dinnerStats[1]); 
                    var tempEndDateTime2 = new Date(dinnerStats[1]); 
                    for(var i=0; i<Math.floor(diffHours2/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'DD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime2);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime2.setHours(tempStartDateTime2.getHours()+3));
                        if(i!=Math.floor(diffHours2/3)-1)
                            actDateTimeList['endDateTime'] = new Date(tempEndDateTime2.setHours(tempStartDateTime2.getHours()+randomHours));
                        else
                            actDateTimeList['endDateTime'] = new Date(maxDateTime);
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);
                }
                else{
                    timeSlotActNumStats = [timeSlotActNumStats[0], 0];
                    const diffTime = Math.abs(maxDateTime - lunchStats[1]);
                    const diffHours = Math.ceil(diffTime / (1000*60*60));
                    //console.log(diffHours);
                    timeSlotActNumStats[1] = Math.floor(diffHours/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime = new Date(lunchStats[1]); 
                    var tempEndDateTime = new Date(lunchStats[1]); 
                    for(var i=0; i<Math.floor(diffHours/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'LLD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                        if(i!=Math.floor(diffHours/3)-1)
                            actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                        else
                            actDateTimeList['endDateTime'] = new Date(maxDateTime);
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);
                }
            }
            else{
                if(dinnerStats[0] != 0){
                    timeSlotActNumStats = [0, 0];
                    const diffTime = Math.abs(dinnerStats[0] - minDateTime);
                    const diffHours = Math.ceil(diffTime / (1000*60*60));
                    //console.log(diffHours);
                    timeSlotActNumStats[0] = Math.floor(diffHours/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime = new Date(minDateTime); 
                    var tempEndDateTime = new Date(minDateTime); 
                    for(var i=0; i<Math.floor(diffHours/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'DDB';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime.setHours(tempStartDateTime.getHours()+3));
                        actDateTimeList['endDateTime'] = new Date(tempEndDateTime.setHours(tempStartDateTime.getHours()+randomHours));
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);

                    const diffTime2 = Math.abs(maxDateTime - dinnerStats[1]);
                    const diffHours2 = Math.ceil(diffTime2 / (1000*60*60));
                    //console.log(diffHours2);
                    timeSlotActNumStats[1] = Math.floor(diffHours2/3);
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime2 = new Date(dinnerStats[1]); 
                    var tempEndDateTime2 = new Date(dinnerStats[1]); 
                    for(var i=0; i<Math.floor(diffHours2/3); i++){
                        var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
        
                        var actDateTimeList = {};
                        actDateTimeList['Location'] = 'DD';
                        if(i==0)    
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime2);
                        else
                            actDateTimeList['startDateTime'] = new Date(tempStartDateTime2.setHours(tempStartDateTime2.getHours()+3));
                        if(i!=Math.floor(diffHours2/3)-1)
                            actDateTimeList['endDateTime'] = new Date(tempEndDateTime2.setHours(tempStartDateTime2.getHours()+randomHours));
                        else
                            actDateTimeList['endDateTime'] = new Date(maxDateTime);
                        actDateTime.push(actDateTimeList);
                    }
                    //console.log(actDateTime);
                }
                else{
                    timeSlotActNumStats = [0];
                    const diffTime = Math.abs(maxDateTime - minDateTime);
                    const diffHours = Math.ceil(diffTime / (1000*60*60));
                    //console.log("hours: " + diffHours);
                    timeSlotActNumStats[0] = 1;
                    //console.log(timeSlotActNumStats);

                    var tempStartDateTime = new Date(minDateTime); 
                    var tempEndDateTime = new Date(maxDateTime); 

                    var randomHours = Math.round((Math.random() * (3 - 1)) + 1);
    
                    var actDateTimeList = {};
                    actDateTimeList['Location'] = 'ALL';
                    actDateTimeList['startDateTime'] = new Date(tempStartDateTime);
                    actDateTimeList['endDateTime'] = new Date(tempEndDateTime);
                    actDateTime.push(actDateTimeList);
                    //console.log(actDateTime);
                }
            }
        }
        //console.log(actDateTime);
        //get total act number
        var maxActNum = 0;
        timeSlotActNumStats.forEach(timeslotnum => {
            maxActNum += timeslotnum;
        });
        //console.log(timeSlotActNumStats);

        //console.log(maxActNum, restaurantNumStats);
        //console.log(minStartTime + " - " + maxEndTime);


        //start machine learning
        // const data = { act, actTypes, ratings };
        console.log(data);
        //const mlData = this.mlData(data);
        console.log(mlData);

        //const model = this.getModel(mlData);

        //console.log(model);
        //0T1TqQBVHiT6Mklmxuj7EGqiOaT2, bPnGWxlrTvYwETIQKGEKTcNB1Si2, firebase.auth().currentUser.uid
        this.train(mlData).then(() => {
            var predictUserData;
            if(!this.state.joinGroup){
                predictUserData = mlData.userData[currentUserId]; 
            }
            else{
                predictUserData = this.getGroupUserData(data, mlData);
            }
            this.recommendResult(predictUserData, restaurantNumStats, data, maxActNum, mlData).then((recommend) => {
                this.setState({
                    buttonText: "為您計劃",
                    //recommendResult: recommend,
                    //isDialogShow: true,
                });
                console.log(recommend);


                const itiTitle = currentName + "的一天" + " (" + moment().format('DD/MM/YYYY') +  ")";

                var recommendAct = [];
                const startTime = '06:01';
                const endTime = "07:01";
                const startDateTimeString = date + " " + startTime;
                const endDateTimeString = date + " " + endTime;
                const tempStartTime = new Date(startDateTimeString);
                const tempEndTime = new Date(endDateTimeString);

                // for(var i=0; i<timeSlotActNumStats[0]; i++){
                //     var tempR = {};
                //     tempR['place_id'] = recommend.filter(a => !a.types.includes('restaurant'))[i].place_id;
                //     tempR['startDateTime'] = new Date(minDateTime);

                //     tempR['endDateTime'] = new Date(minDateTime.setHours(minDateTime.getHours()+timeSlotActNumStats[0]));
                //     //tempTime.setHours(tempTime.getHours()+1);
                //     recommendAct.push(tempR);
                // }

                var index = 0;
                actDateTime.filter(a => a.Location=='BB' || a.Location=='LLB' || a.Location=='ALL').forEach(actdatetime => {
                    var tempR = {};
                    tempR['place_id'] = recommend.filter(a => !a.types.includes('restaurant'))[index].place_id;
                    tempR['name'] = recommend.filter(a => !a.types.includes('restaurant'))[index].title;
                    tempR['startDateTime'] = new Date(actdatetime.startDateTime);
                    tempR['endDateTime'] = new Date(actdatetime.endDateTime);
                    recommendAct.push(tempR);   
                    index++;
                });

                if(breakfastStats[0] != 0){
                    var tempR = {};
                    tempR['place_id'] = recommend[0].place_id;
                    tempR['name'] = recommend[0].title;
                    tempR['startDateTime'] = new Date(breakfastStats[0]);
                    tempR['endDateTime'] = new Date(breakfastStats[1]);
                    
                    recommendAct.push(tempR);
                }

                actDateTime.filter(a => a.Location=='BL' || a.Location=='BD').forEach(actdatetime => {
                    var tempR = {};
                    tempR['place_id'] = recommend.filter(a => !a.types.includes('restaurant'))[index].place_id;
                    tempR['name'] = recommend.filter(a => !a.types.includes('restaurant'))[index].title;
                    tempR['startDateTime'] = new Date(actdatetime.startDateTime);
                    tempR['endDateTime'] = new Date(actdatetime.endDateTime);
                    recommendAct.push(tempR);   
                    index++;
                });

                if(lunchStats[0] != 0){
                    var i = 0;
                    if(breakfastStats[0] != 0) i = 1;

                    var tempR = {};
                    tempR['place_id'] = recommend[i].place_id;
                    tempR['name'] = recommend[i].title;
                    tempR['startDateTime'] = new Date(lunchStats[0]);
                    tempR['endDateTime'] = new Date(lunchStats[1]);

                    recommendAct.push(tempR);
                }

                actDateTime.filter(a => a.Location=='LD').forEach(actdatetime => {
                    var tempR = {};
                    tempR['place_id'] = recommend.filter(a => !a.types.includes('restaurant'))[index].place_id;
                    tempR['name'] = recommend.filter(a => !a.types.includes('restaurant'))[index].title;
                    tempR['startDateTime'] = new Date(actdatetime.startDateTime);
                    tempR['endDateTime'] = new Date(actdatetime.endDateTime);
                    recommendAct.push(tempR);   
                    index++;
                });

                if(dinnerStats[0] != 0){
                    var i = 0;
                    if(breakfastStats[0] != 0 || lunchStats[0] != 0) i = 1;
                    if(breakfastStats[0] != 0 && lunchStats[0] != 0) i = 2;

                    var tempR = {};
                    tempR['place_id'] = recommend[i].place_id;
                    tempR['name'] = recommend[i].title;
                    tempR['startDateTime'] = new Date(dinnerStats[0]);
                    tempR['endDateTime'] = new Date(dinnerStats[1]);

                    recommendAct.push(tempR);
                }

                actDateTime.filter(a => a.Location=='LLD' || a.Location=='DD').forEach(actdatetime => {
                    var tempR = {};
                    tempR['place_id'] = recommend.filter(a => !a.types.includes('restaurant'))[index].place_id;
                    tempR['name'] = recommend.filter(a => !a.types.includes('restaurant'))[index].title;
                    tempR['startDateTime'] = new Date(actdatetime.startDateTime);
                    tempR['endDateTime'] = new Date(actdatetime.endDateTime);
                    recommendAct.push(tempR);   
                    index++;
                });

                //showRecommendResult();
                this.props.navigation.navigate('RecommendResultScreen', {
                    recommendAct: recommendAct,
                    name: itiTitle,
                    userId: joinMember,
                    minMember: minMember,
                    maxMember: maxMember,
                    travelMode: travelMode,
                    goBackKey: '123456',
                });

                this.reset();
            });
        });

    }   

    mlData(data) {     
        //users data
        const userData = {};
        for (let rating of Object.values(data.ratings)) {
            const { users, activities } = rating;
            
            if (!userData[users]) {
                userData[users] = {actTypes: data.actTypes.map( () => 0 ), rating: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ratingMinMax: [ 1, 0 ]};
            }
            
            if (userData[users].ratingMinMax[0] > rating.rating){
                userData[users].ratingMinMax[0] = rating.rating;
            }
            if (userData[users].ratingMinMax[1] < rating.rating){
                userData[users].ratingMinMax[1] = rating.rating;
            }

            if (data.act[activities]) {
                for(var i=0; i<data.act[activities].types.length; i++){
                    userData[users].actTypes[data.actTypes.indexOf(data.act[activities].types[i])] = userData[users].actTypes[data.actTypes.indexOf(data.act[activities].types[i])]  + (1 / Object.keys(data.act).length);
                }
                userData[users].rating[ Math.floor(rating.rating * 10) - 1 ] = userData[users].rating[ Math.floor(rating.rating * 10) - 1 ] + (1 / Object.keys(data.act).length);
            }
        }

        const xs = [];
        const ys = [];

        //activities data
        const actData = {};
        for (let activity of Object.values(data.act)) {
            const typeList = [];

            for(var i=0; i<data.actTypes.length; i++){
                var isActType;
                if(activity.types.indexOf(data.actTypes[i]) == -1)
                    isActType = 0;
                else
                    isActType = 1;
                typeList.push(isActType);
            }
          
            actData[activity.id] = { 
                id: activity.id, 
                name: activity.name, 
                stats: typeList 
            };
        }
        
        //training data
        const trainingData = {
            xs: xs, 
            ys: ys
        };
        for (let rating of Object.values(data.ratings)) {
            if (actData[rating.activities]) {
                trainingData.xs.push([].concat(userData[rating.users].ratingMinMax).concat(userData[rating.users].actTypes).concat(userData[rating.users].rating).concat(actData[rating.activities].stats));
                trainingData.ys.push(rating.rating);
            }
        }
       
        return {userData: userData, actData: actData, trainingData: trainingData}
    }

    getModel(data) {
        
        //create a sequential model;
        const model = tf.sequential();

        //Hidden layer
        const activation = "relu6";
        const configHidden = {
            units: 8, 
            activation: activation,
            inputShape: [data.trainingData.xs[0].length]
        }
        const hidden = tf.layers.dense(configHidden);

        //output layer
        const configOutput = {
            units: 1
        }
        const output = tf.layers.dense(configOutput);

        //add layers to model
        model.add(hidden);
        model.add(output);

        //compile the model
        const learningRate = 0.05;
        const optimizer = tf.train.adam(learningRate);
        const loss = "meanSquaredError";
        const metrics = ["accuracy"];
        model.compile({optimizer: optimizer, loss: loss, metrics: metrics});
        
        return model;
    }

    async train(data) {
        console.log("training start!");
        const batchSize = 10000;
        const epochs = Math.floor(data.trainingData.xs.length/batchSize);
        const validationSplit = 0.2;

        const xs = tf.tensor2d(data.trainingData.xs.slice(0, 10000), [10000, data.trainingData.xs[0].length]);

        const ys = tf.tensor2d(data.trainingData.ys.slice(0, 10000), [10000, 1]);

        model = this.getModel(data);
        for (let i = 0; i < 3; i++) {
            await model.fit(xs, ys, {
                batchSize: batchSize,
                validationSplit: validationSplit,
                epochs: epochs
            })
            .then((history) => console.log("loss: " + history.history.loss[0]));      
        }
        console.log("training complete!");
    }

    async recommendResult(userData, restaurantNum, data, maxActNum, mlData) {
        console.log("recommend start!");
        const { act } = data;
        let results = [];
        var i = 0;
        for (let activity of Object.values(act)) {
            const ratingMinMax = userData?userData.ratingMinMax:[1,0];

            const actTypes = userData?userData.actTypes:data.actTypes.map( () => 0 );
            const rating = userData?userData.rating:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const stats = mlData.actData[activity.id].stats;

            const predictUserData = [].concat(ratingMinMax).concat(actTypes).concat(rating).concat(stats);
            const rateResult = await model.predict(tf.tensor([predictUserData])).data();

            results.push({ "title": activity.name, "place_id": activity.id, "types": activity.types, "rate" : rateResult[0]});
        }
        
        var recommendResultFood = results.filter(a => a.types.includes('restaurant')).sort((a, b) => b.rate - a.rate).slice(0, restaurantNum);
        var recommendResultOther = results.filter(a => !a.types.includes('restaurant')).sort((a, b) => b.rate - a.rate).slice(0, maxActNum);
        var recommendResult = [...recommendResultFood, ...recommendResultOther];
        
        console.log("recommend end!");

        return recommendResult;
    }

    groupView(){
        const groupMember = this.getGroupMemberId();
        var joinGroupText = this.state.joinGroup?this.getGroupName(groupMember):"0個群組";
        return(
            <View style={styles.quesContainer, {top: height*0.15}}>
                <Text style={styles.title}>選擇群組</Text>
                <Button
                    title={joinGroupText}
                    titleStyle={{color: '#000'}}
                    buttonStyle={styles.gpButtonValid}
                    onPress={this.toggleJoinGroupScreen}
                />
            </View>
        )
    }

    getData(){
        //act and type
        const { activities } = this.state;
        const act = {};
        const actTypes = [];
        activities.forEach(activity => {
            var { place_id, name, types } = activity;
            types = types.filter(a => a !== 'establishment' && a !== 'point_of_interest' && a !== 'lodging' && a !== 'premise' && a !== 'doctor' && a !== 'meal_takeaway' && a !== 'meal_delivery' );
            types.forEach(type => {
                if (actTypes.indexOf(type) === -1) {
                    actTypes.push(type);
                }
            })

            act[place_id] = {
                id: place_id,
                name,
                types: types,
            };
        });
        //console.log(actTypes);


        const { users, itineraries } = this.state;
        const ratings = [];

        //each user rating record
        users.map(user => {
            const { uid } = user;
            var favActId = user.favActId?user.favActId:[];
            var hobby = user.preference && user.preference.hobby?user.preference.hobby:[];
            var place = user.preference && user.preference.place?user.preference.place:[];
            var itineraryId = user.itineraryId?user.itineraryId:[];

            var allFavActList = [];
            var favActList = [];

            //add favorite activities to allFavActList
            allFavActList = [...allFavActList, ...favActId];

            //add join itineraries to allFavActList
            var itiActList = [];
            itineraryId.forEach(iid => {
                itineraries.filter(a => a.iid == iid).forEach(itinerary => {
                    const itiActs = itinerary.activities;
                    itiActs.forEach(activity => {
                        itiActList.push(activity.place_id);
                    });
                })
            })
            allFavActList = [...allFavActList, ...itiActList];

            //add hobby activity types to allFavActList
            var hobbyActList = [];
            hobby.forEach(hob =>{
                for (let activity of Object.values(act)) {
                    if(hob == "hiking"){
                        if(activity.types.includes("shoe_store") || activity.types.includes("clothing_store") || activity.types.includes("gym") || activity.types.includes("health")){
                            hobbyActList.push(activity.id);
                        }
                    }
                    else if(hob == "indoor_sport"){
                        if(activity.types.includes("gym") || activity.types.includes("health") || activity.types.includes("bowling_alley")){
                            hobbyActList.push(activity.id);
                        }
                    }
                    else if(hob == "pottery"){
                        if(activity.types.includes("museum") || activity.types.includes("place_of_worship") || activity.types.includes("furniture_store") || activity.types.includes("art_gallery")){
                            hobbyActList.push(activity.id);
                        }
                    }
                    else if(hob == "board_game"){
                        if(activity.types.includes("shopping_mall", "movie_theater") || activity.types.includes("movie_theater")){
                            hobbyActList.push(activity.id);
                        }
                    }
                    else if(hob == "shopping"){
                        if(activity.types.includes("store") || activity.types.includes("shopping_mall") || activity.types.includes("department_store") || activity.types.includes("supermarket") || activity.types.includes("grocery_or_supermarket") || activity.types.includes("shoe_store") || activity.types.includes("electronics_store") || activity.types.includes("furniture_store") || activity.types.includes("home_goods_store") || activity.types.includes("clothing_store")){
                            hobbyActList.push(activity.id);
                        }
                    }
                }
            });
            allFavActList = [...allFavActList, ...hobbyActList];
            //console.log(uid, memberStatus);

            //add place activity type to allFavActList
            var placeActList = [];
            place.forEach(p =>{
                activities.forEach(activity => {
                    var { place_id, types } = activity;
                    types = types.filter(a => a !== 'establishment' && a !== 'point_of_interest' && a !== 'lodging' && a !== 'premise' && a !== 'doctor' && a !== 'meal_takeaway' && a !== 'meal_delivery' );
                    if(types.includes(p)){
                        placeActList.push(place_id);
                    }
                });
            });
            allFavActList = [...allFavActList, ...placeActList];
            //console.log(uid, placeActList, allFavActList);


            var maxRating = 0;

            //favorite list without duplicate
            for(var i=0; i<allFavActList.length; i++){
                if(!favActList.includes(allFavActList[i]))
                    favActList.push(allFavActList[i])
            }

            //maximum rating score
            for(var i=0; i<favActList.length; i++){
                if(maxRating < allFavActList.filter(a => a == favActList[i]).length){
                    maxRating = allFavActList.filter(a => a == favActList[i]).length;
                }
            }

            //store rating data
            favActList.forEach(favactlist => {
                const ratingData = {};
                ratingData['users'] = uid;
                ratingData['activities'] = favactlist;
                ratingData['rating'] = allFavActList.filter(a => a == favactlist).length/maxRating;
                ratings.push(ratingData);
            });
            // for(var i=0; i<50; i++){
            //     const ratingData = {};
            //     ratingData['users'] = uid;
            //     ratingData['activities'] = favActList[i];
            //     ratingData['rating'] = allFavActList.filter(a => a == favActList[i]).length/maxRating;
            //     ratings.push(ratingData);
            // }
        })

        const data = { act, actTypes, ratings };
        return data;
    }

    render(){
        const { fdLoading, userLoading, actLoading, groupLoading, itiLoading } = this.state;
        const { filter } = this.props.route.params;
        //var buttonText = buttonLoading?<ActivityIndicator style={{height:50, width: 50}}/>:"為您計劃";

        if(!fdLoading && !userLoading && !actLoading && !groupLoading && !itiLoading){
            if(filter == 'Manual'){
                return(
                    <ScrollView 
                        style={styles.container}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.state.refreshing}
                                onRefresh={this._onRefresh.bind(this)}
                            />
                        }
                    >
                        {/* {this.renderTitle()} */}
                        {this.renderSurvey()}
                        {/* {this.renderMemberList()} */}
                        {this.renderTravelModeList()}
                        {this.renderGroupList()}
                        {this.renderMemberList()}
                        {this.renderActList()}
                    </ScrollView>
                )
            }
            else{
                if(this.state.data.length==0){
                    const data = this.getData();
                    this.setState({
                        data: data
                    })
                    this.setState({
                        mlData: this.mlData(data)
                    })
                }
                // const data = this.getData();
                // const mlData = this.mlData(data);
                if(this.state.data && this.state.mlData){
                    return(
                        <ScrollView
                            refreshControl={
                                <RefreshControl
                                    refreshing={this.state.refreshing}
                                    onRefresh={this._onRefresh.bind(this)}
                                />
                            }
                        >
                            <View style={styles.form}>
                                {this.groupView()}
                                <View style={{top: height*0.35, height: height, alignSelf: "center"}}>
                                    <Button 
                                        title={this.state.buttonText}
                                        titleStyle={{fontSize: 20, fontWeight: 'bold'}}
                                        buttonStyle={{borderRadius: 150/2, height: 150, width: 150, backgroundColor: '#FFC300'}}
                                        onPress={() => {
                                            this.runML(this.state.data, this.state.mlData); 
                                        }}
                                    />
                                </View>
                            </View>
                            {this.renderGroupList()}
                            {/* {this.renderDialog()} */}
                        </ScrollView>
                    )
                }
                else{
                    return <ActivityIndicator />
                }
            }
        }
        else{
            return <ActivityIndicator />
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    greetContainter: {
        marginTop: 40, 
        justifyContent: 'center',
    }, 
    greeting:{
        letterSpacing: 5, 
        lineHeight: 30,
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center', 
        alignSelf: 'center', 
        textTransform: 'uppercase', 
    }, 
    modelContainer: {
        // backgroundColor: '#fff',
        flex: 1,
        width: width*0.6,
        height: 20,
        alignSelf: 'center',

    },
    actModelContainer: {
        // backgroundColor: '#fff',
        flex: 1,
        width: width*0.95,
        height: 20,
        alignSelf: 'center',

    },
    memberTitleContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
    },
    form: {
        width: 'auto',
        marginBottom: 36,
        marginHorizontal: 36, 
        justifyContent: 'space-between',
    }, 
    inputRow: {
        width: 'auto', 
        flexDirection:'row', 
        alignItems: 'center',
        justifyContent: 'space-between',
    }, 
    input: {
        borderBottomColor: '#8A8F9E',
        borderBottomWidth: StyleSheet.hairlineWidth,
        height: 43, 
        fontSize: 15,
        color: '#161F30', 
    }, 
    title: { 
        textTransform: 'capitalize', 
        fontWeight: 'bold', 
        alignSelf: 'center', 
        fontSize: 20, 
        marginTop: 15, 
        marginBottom: 10,
    },     
    quesContainer: {
        marginBottom: 20,
    },
    buttonValid: {
        backgroundColor: '#0f0', 
        borderWidth: 1, 
        borderColor: '#CDDDE0',
        borderRadius:10,
    },
    gpButtonValid: {
        backgroundColor: '#rgba(52, 52, 52, 0)', 
        borderWidth: 1, 
        borderColor: '#CDDDE0',
        borderRadius:10,
    },
    buttonInvalid: {
        backgroundColor: 'red', 
        borderWidth: 1, 
        borderColor: '#CDDDE0',
        borderRadius:10,
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
    memTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        alignSelf: 'center',
        color: '#000',
        marginVertical: 10,
    },
    listImage: {
        width: 40, 
        height: 40,
        borderRadius: 10,
    },
    listtitle: {
        fontSize: 16,
        color: '#000',
        // alignSelf: 'center',
        // fontWeight: 'bold',
    },
    actTimeTitle: {
        fontSize: 16,
        color: '#000',
        alignSelf: 'center',
        fontWeight: 'bold',
    },
    listcontainer: {
        //height: 100,
        backgroundColor: '#F2F2F2',
        borderBottomWidth: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
    dialog: {
        position: 'absolute', 
        backgroundColor: "white",
        justifyContent: 'space-between', 
        alignItems: 'stretch',
        alignSelf: 'center',
        borderRadius: 3,
        paddingHorizontal: 12, 
        width: width * 0.85, 
        height: height * 0.2,
        marginVertical: height * 0.4,
    }, 
    dialogTitle: {
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold',
        marginTop: 15, 
        marginHorizontal:12,
    }, 
    dialogOptions:{
        flexDirection: 'row',
        alignItems: 'flex-end',
        alignSelf: 'flex-end',
    }, 
});