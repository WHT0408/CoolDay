import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import { 
    View, 
    Text, 
    Image, 
    ScrollView,
    StyleSheet, 
    Dimensions, 
    RefreshControl, 
    ActivityIndicator, 
    TouchableOpacity, 
} from 'react-native';

import { List, ListItem, Icon, } from 'react-native-elements';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class AddMember extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            gid: this.props.route.params.gid,
            members: [], 
            oldMembers: [],
            friendInfoList: [], 
            isLoading: true, 
            refreshing: false, 
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        const { gid, } = this.state;
        this.setState({ isLoading: true, });
        var friendId = [];
        var members = [], oldMembers = [];
        var friendInfoList = [];

        await firebase
            .firestore()
            .collection('Users')
            .doc(firebase.auth().currentUser.uid)
            .get()
            .then(doc => {
                friendId = doc.data().friendId;
            });
            
        await firebase
            .firestore()
            .collection('FriendGroup')
            .doc(gid)
            .get()
            .then(doc => {
                oldMembers = doc.data().members;
                this.setState({ oldMembers: oldMembers, members: oldMembers });
            });

        if(friendId && friendId.length > 0) {
            for (var index = 0; index < friendId.length; index = index + 10) {
                var slice = friendId.slice(index, (index + 10 < friendId.length) ? index + 10 : friendId.length);
                await firebase.firestore()
                    .collection('Users')
                    .where('__name__', 'in', slice)
                    .get()
                    .then(querySnapshot => {
                        querySnapshot.forEach(function(doc) {
                            var data = { uid: doc.id, ...doc.data() };
                            friendInfoList = [ ...friendInfoList, data ];
                        });
                        friendInfoList.sort((a, b) => a.displayName.localeCompare(b.displayName));
                        this.setState({ friendInfoList, isLoading: false });
                    });
            }
        }
    }

    AddNewMember(uid) {
        var { members } = this.state;

        if(!members.includes(uid)){
            members = [ ...members, uid ];
        } else {
            members = members.filter(member => member !== uid);
        }
        this.setState({ members });
    }

    handleSubmit = () => {
        const { gid, members, oldMembers, } = this.state;

        members.forEach(uid => {
            if(!oldMembers.includes(uid)) {
                var memberRef = firebase
                    .firestore()
                    .collection('Users')
                    .doc(uid);
                    
                    memberRef.update({
                        groupId: firestore.FieldValue.arrayUnion(gid)
                    });

                    var groupRef = firebase
                        .firestore()
                        .collection('FriendGroup')
                        .doc(gid);
                    
                    groupRef.update({
                        members: firestore.FieldValue.arrayUnion(uid)
                    });
            } 
        });

        oldMembers.forEach(uid => {
            if(!members.includes(uid)) {
                var memberRef = firebase
                    .firestore()
                    .collection('Users')
                    .doc(uid);
                    
                    memberRef.update({
                        groupId: firestore.FieldValue.arrayRemove(gid)
                    });

                    var groupRef = firebase
                        .firestore()
                        .collection('FriendGroup')
                        .doc(gid);
                    
                    groupRef.update({
                        members: firestore.FieldValue.arrayRemove(uid)
                    });
            } 
        });

        this.props.navigation.goBack();
    }

    _onRefresh(){
        this.setState({ refreshing: true, });
        this.initialData().then(() => {
            this.setState({ refreshing: false, });
        });
    }

    render(){
        const { navigation, } = this.props;
        const { info, members, friendInfoList, isLoading, } = this.state;

        navigation.setOptions({
            headerRight: () => (
                <Icon name='add' color='#0f0' containerStyle={{ marginRight: 15, }} onPress={ this.handleSubmit } />
            ), 
        });

        return(
            !isLoading ?
                friendInfoList.length ?
                    <ScrollView style={styles.container}
                        refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this._onRefresh.bind(this)} />}
                    >
                        {
                            friendInfoList.map((item, index) => (
                                <ListItem
                                    key={index} 
                                    contentContainerStyle={{ height:50, }} 
                                    leftAvatar={
                                        <Image
                                            source= { item.photoURL ? { uri: item.photoURL } : require('../../image/Default.png') }
                                            style={styles.listImage}
                                        />
                                    }
                                    checkBox={{
                                        iconType: 'material', 
                                        checkedIcon: 'check-box', 
                                        uncheckedIcon: 'check-box-outline-blank', 
                                        uncheckedColor:'#000', 
                                        checkedColor: '#000', 
                                        onPress:() => this.AddNewMember(item.uid),
                                        checked: members.includes(item.uid),
                                    }}
                                    title={item.displayName} 
                                    titleStyle={styles.displayName} 
                                    bottomDivider 
                                    onPress={ () => navigation.navigate('UserInfo', { infos: item, }) }
                                />
                            ))
                        }
                    </ScrollView>

                    :

                    <View style={[styles.container, { justifyContent: 'center', }]}>
                        <Icon type='material-community' name='emoticon-cry' size={55} color='#edac00' />
                        <Text style={styles.noFriendText}> {'找不到你的好友'} </Text>
                    </View>
                :
                <ActivityIndicator />
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    }, 
    button: {
        marginHorizontal: 10,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center", 
    },
    buttonText: {
        color: '#05f', 
        textDecorationStyle: 'solid',
        margin: 10, 
    },
    displayName: {
        fontWeight: 'bold', 
    }, 
    noFriendText:{
        fontWeight: 'bold', 
        alignSelf: 'center',
        fontSize: 20, 
        maxWidth: width * 0.7, 
        textAlign: 'center', 
    }, 
    listImage: {
        width: 50, 
        height: 50,
        borderRadius: 180,
    }, 
});