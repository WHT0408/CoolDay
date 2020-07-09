import React, { Component } from 'react';
import { version as APP_VERSION }  from '../../package.json';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';

import { 
    View, 
    Text, 
    Image, 
    ScrollView,
    StyleSheet, 
    Dimensions, 
    RefreshControl, 
    ActivityIndicator, 
} from 'react-native';
import { List, ListItem, Icon, } from 'react-native-elements';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class UserInfo extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            ...this.props.route.params.infos, 
            isFriend: false, 
            itineraries: [], 
            isLoading: true, 
            refreshing: false, 
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        this.setState({ isLoading: true });
        const { uid } = this.state;
        var itineraryId = [];

        await firebase
            .firestore()
            .collection('Users')
            .doc(firebase.auth().currentUser.uid)
            .get()
            .then(doc => {
                var friendId = doc.data().friendId;
                this.setState({ isFriend: friendId ?  friendId.includes(uid): false });
            });

        await firebase
            .firestore()
            .collection('Users')
            .doc(uid)
            .get()
            .then(doc => {
                itineraryId = [ ...doc.data().itineraryId ];
                itineraryId.map((id, i) => {
                    firebase
                        .firestore()
                        .collection('itineraries')
                        .doc(id)
                        .get()
                        .then(itiDoc => {
                            var data = itiDoc.data();
                            data.startDateTime = data.startDateTime.toDate().toString();
                            data.endDateTime = data.endDateTime.toDate().toString();

                            firebase.database().ref('activities')
                                .orderByChild('place_id')
                                .startAt(data.activities[0].place_id)
                                .endAt(data.activities[0].place_id + "\uf8ff")
                                .once("value", (snapshot) => {
                                    snapshot.forEach((actDoc) => {
                                        var actData = { ...actDoc.val() };
                                        const img = actData.photos ? this.getImageUrl(actData.photos[0].photo_reference) : "";
                                        this.setState({ itineraries: [ ...this.state.itineraries, { ...data, img } ] });
                                    });
                                });
                        });
                });
                this.setState({ isLoading: false, });
            });
    }

    _onRefresh(){
        this.setState({ refreshing: true, });
        this.initialData().then(() => {
            this.setState({ refreshing: false, });
        });
    }

    getImageUrl(photoRef){
        const url = "https://maps.googleapis.com/maps/api/place/photo?";
        const maxwidth = `maxwidth=400`;
        const photoreference = `&photoreference=${photoRef}`;
        const api_key = `&key=AIzaSyBhKUnbXmXD3eXdWP3iHspHFs73E1MjUF0`;
        return `${url}${maxwidth}${photoreference}${api_key}`;
    }

    toggleFriend = () => {
        const { navigation } = this.props;
        const { isFriend, uid } = this.state;

        if( !isFriend ) {
            var currentUserRef = firebase
                .firestore()
                .collection('Users')
                .doc(firebase.auth().currentUser.uid);
            
            currentUserRef.update({
                friendId: firestore.FieldValue.arrayUnion(uid)
            });
            
            this.setState({ isFriend: true });
        } else {
            var currentUserRef = firebase
                .firestore()
                .collection('Users')
                .doc(firebase.auth().currentUser.uid);
            
            currentUserRef.update({
                friendId: firestore.FieldValue.arrayRemove(uid)
            });
            this.setState({ isFriend: false });
        }
    }

    render() {
        const { navigation } = this.props;
        const photo = this.state.photoURL ? { uri: this.state.photoURL }: require('../../image/Default.png');
        const infolist = [
            {
                title: '稱謂',
                text: this.state.title, 
            }, 
            {
                title: '名字',
                text: this.state.firstName, 
            }, 
            {
                title: '姓氏',
                text: this.state.lastName, 
            }, 
            {
                title: '性別',
                text: this.state.gender, 
            }, 
            {
                title: '電子郵件',
                text: this.state.email, 
            }, 
            {
                title: '電話號碼',
                text: this.state.phoneNo, 
            }, 
        ]
        
        if(firebase.auth().currentUser && this.state.uid !== firebase.auth().currentUser.uid){
            
            navigation.setOptions({
                headerRight: () => (
                    <Icon 
                        type='material' 
                        name={ !this.state.isFriend ? 'add' : 'clear' } 
                        color={ !this.state.isFriend ? '#0f0' : '#f00' } 
                        onPress={ this.toggleFriend }
                        containerStyle={{ marginRight: 15, }}
                    />
                ), 
            });
        }

        return(
            !this.state.isLoading ? 
                <View style={styles.container}>
                    <ScrollView  refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this._onRefresh.bind(this)} />} >

                        <View style={{ alignItems: 'center', marginVertical: 50, }}>
                            <Image 
                                source={photo} 
                                style={styles.image}
                            />
                            <Text style={styles.displayName}>{ this.state.displayName }</Text>
                        </View>
                        
                        <View style={{ marginBottom: 32, }}>
                            {
                                infolist.map((l, i) => (
                                    <ListItem
                                        key={i}
                                        title={l.title}
                                        rightTitle={l.text}
                                        bottomDivider
                                        titleStyle={styles.infoTitle}
                                        rightTitleStyle={styles.infoText}
                                    />
                                ))
                            }
                        </View>
                        
                        <View style={{ backgroundColor: 'white', }}>
                            {
                                this.state.itineraries.length > 0 ?
                                    <Text style={styles.userItinerary}>帳戶行程</Text>
                                : null
                            }

                            {
                                this.state.itineraries.sort((a,b) => moment(b.startDateTime).format('YYYYMMDD') - moment(a.startDateTime).format('YYYYMMDD')).map((itinerary, i) => (
                                    <ListItem
                                        key={i}
                                        title={itinerary.name}
                                        subtitle={`${moment(itinerary.startDateTime).format('DD/MM/YYYY')} ‧ ${moment(itinerary.startDateTime).format('HH:mm')} - ${moment(itinerary.endDateTime).format('HH:mm')}`}
                                        leftAvatar={
                                            <View style={styles.center}>
                                                <Image 
                                                    source={{uri: itinerary.img?itinerary.img:undefined}}
                                                    style={styles.listImage}
                                                />
                                            </View> 
                                        }
                                        
                                        containerStyle={styles.listcontainer}
                                        titleStyle={styles.listtitle}
                                        subtitleStyle={styles.listsubtitle}
                                        chevron
                                        onPress={() => this.props.navigation.navigate("ScheduleDetailScreen", {
                                            itinerary: itinerary,
                                        })}
                                    />
                                ))
                            }
                        </View>
                    </ScrollView>
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
    version: {
        fontWeight: 'bold', 
        color: '#8A8F9E', 
        alignSelf: 'center', 
        marginBottom: 20, 
    }, 
    displayName: { 
        fontWeight: 'bold', 
        fontSize: 20, 
        textAlign: 'center', 
        marginTop: 10, 
        width: '100%', 
    }, 
    infoTitle: {
        textTransform: 'uppercase', 
        fontWeight: 'bold', 
        width: width * 0.3, 
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
    button: {
        marginHorizontal: 30,
        marginVertical: 30, 
        backgroundColor: "#FFC30B",
        borderRadius: 4,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
    },
    chevron: {
        color: '#555',
    },
    userItinerary: { 
        fontSize: 20, 
        fontWeight: 'bold', 
        alignSelf: 'center', 
        color: 'black', 
        marginVertical: 20,
    },
    listcontainer: {
        backgroundColor: '#F0F0F0',
        borderTopWidth: 1,
        alignItems: 'stretch',
        justifyContent: 'center', 
    },
    listtitle: {
        fontSize: 20,
        color: '#000',
        fontWeight: 'bold',
        fontFamily: 'serif',
    },
    listsubtitle: {
        marginTop: 5,
        // marginLeft: 10,
    },
    listImage: {
        width: 80, 
        height: 80,
        borderRadius: 10,
    },
    center:{
        justifyContent: 'center'
    },
});