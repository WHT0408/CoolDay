import React, { Component } from 'react';
import { version as APP_VERSION }  from '../../package.json';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'

import { 
    View, 
    Text, 
    Image, 
    Alert, 
    ScrollView,
    StyleSheet, 
    Dimensions, 
    RefreshControl, 
    TouchableOpacity, 
    ActivityIndicator, 
} from 'react-native';
import moment from 'moment';
import { List, ListItem, Icon, } from 'react-native-elements';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class GroupInfo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            gid: this.props.route.params.gid, 
            groupName: '',
            photoURL: '',
            creator: '', 
            createdDate: '', 
            members: [], 
            memberList: [], 
            isAdmin: false, 
            refreshing: false, 
            isLoading: true, 
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        this.setState({ isLoading: true, });
        var creator='', groupName='', photoURL='',createdBy='', createdDate='', admin=[], members=[], memberList = [];
        const { gid } = this.state;

        await firebase
            .firestore()
            .collection('FriendGroup')
            .doc(gid)
            .get()
            .then(doc => {
                var data = doc.data();
                members = data.members;
                groupName= data.groupName;
                admin = data.admin;
                createdBy = data.createdBy;
                photoURL = data.photoURL;
                createdDate = moment(data.isCreatedAt.toDate()).format('DD/MM/YYYY');
            });

        for (var index = 0; index < members.length; index = (index < members.length) ? index + 10 : members.length -1 ) {
            var slice = members.slice(index, (index < members.length) ? index + 10 : members.length - 1);
            await firebase
                .firestore()
                .collection('Users')
                .where('__name__', 'in', slice)
                .get()
                .then(querySnapshot => {
                    querySnapshot.forEach(function(doc) {
                        var data = { uid: doc.id, ...doc.data(), isAdmin: admin.includes(doc.id) };
                        memberList = [ ...memberList, data ];
                    });
                });
        }

        creator = memberList.find(member => member.uid === createdBy).displayName;
        memberList.sort((a, b) => a.displayName.localeCompare(b.displayName));
        this.setState({ creator, createdDate, groupName, photoURL, members, memberList, isAdmin: admin.includes(firebase.auth().currentUser.uid), isLoading: false, });
    }

    _onRefresh(){
        this.setState({ refreshing: true, });
        this.initialData().then(() => {
            this.setState({ refreshing: false, });
        });
    }

    render() {
        const { navigation } = this.props;
        const { gid, groupName, creator, isCreatedAt, members, memberList, createdDate, isAdmin, isLoading, } = this.state;
        const photo = this.state.photoURL ? { uri: this.state.photoURL }: require('../../image/Default.png');

        if(this.state.isAdmin) {
            navigation.setOptions({
                headerRight: () => (
                    <Icon name='person-add' containerStyle={{ marginRight: 15, }} onPress={() => navigation.navigate('AddMember', { gid: gid, members: members }) } />
                ), 
            });
        }

        return(
            !isLoading ? 
                <ScrollView styles={styles.container} 
                    refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this._onRefresh.bind(this)} />}
                >
                    <View style={{ alignItems: 'center', marginVertical: 50, }}>
                        <Image 
                            source={photo} 
                            style={ styles.image }
                        />
                        <Text style={styles.groupName}>{groupName}</Text>
                    </View>

                    <Text style={styles.created}>{ creator ? '由 ' + creator + ' 於 ' + createdDate + ' 建立' : '建立於 ' + createdDate }</Text>
                    {
                        memberList.map((item, index) => (
                            <ListItem
                                key={index}
                                contentContainerStyle={{ height:50, }} 
                                title={item.displayName}
                                rightTitle={ item.isAdmin ? '群組管理員' : '' }
                                leftAvatar={ 
                                    <Image 
                                        source={item.photoURL ? { uri: item.photoURL } : require('../../image/Default.png')}
                                        style={styles.listImage}
                                    /> 
                                }
                                bottomDivider
                                titleStyle={styles.displayName}
                                rightTitleStyle={styles.infoText}
                                onPress={ () => navigation.navigate('UserInfo', { infos: item }) }
                            />
                        ))
                    }

                    {/* {
                        isAdmin ?
                            <TouchableOpacity style={styles.button} onLongPress={ () => {
                                Alert.alert(
                                    '已刪除的群組將無法恢復', 
                                    '您確定要刪除嗎？',
                                    [
                                        { text: '確定', onPress: () => this.DeleteGroup() },
                                        { text: '確定', style: 'cancel' },
                                    ]
                                )
                            } }>
                                <Text style={styles.buttonText}> {'按住以刪除群組'} </Text>
                            </TouchableOpacity>
                        :
                        <View style={{ height:50, }}></View>
                    } */}

                </ScrollView>
            :
            <ActivityIndicator />
        );
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    created: {
        color: '#8A8F9E', 
        marginBottom: 15, 
    }, 
    groupName: { 
        fontWeight: 'bold', 
        fontSize: 20, 
        marginTop: 10, 
        textAlign: 'center', 
        width: '100%', 
    }, 
    displayName:{
        fontWeight: 'bold', 
    }, 
    infoText: {
        width: width * 0.7,
        fontSize: 15, 
        textAlign: 'right', 
    }, 
    image: {
        height: 175,
        width: 175,
        alignSelf: 'center', 
        overflow: 'hidden',
        borderRadius: 180,
    },     
    listImage: {
        width: 50, 
        height: 50,
        borderRadius: 180,
    },
    button: {
        marginHorizontal: 50,
        marginVertical: 30, 
        backgroundColor: "#FFC30B",
        borderRadius: 4,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
    }, 
    buttonText: {
        color: '#f50', 
        fontWeight: 'bold', 
        textDecorationStyle: 'solid',
        fontSize: 15,
        margin: 10, 
    },
});