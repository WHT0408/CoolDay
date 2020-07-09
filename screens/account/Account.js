import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { version as APP_VERSION}  from '../../package.json';

import { 
    View, 
    Text, 
    Image, 
    ScrollView,
    StyleSheet, 
    Dimensions, 
    RefreshControl, 
    TouchableOpacity, 
    ActivityIndicator, 
} from 'react-native';
import { List, ListItem, Icon, } from 'react-native-elements';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class Account extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            email: '', 
            displayName: '', 
            photoURL: '', 
            title: '', 
            firstName: '', 
            lastName: '', 
            gender: '', 
            phoneNo: '', 
            friendId: [], 
            refreshing: false, 
        };  
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        var data = {};

        const docRef = firebase
            .firestore()
            .collection('Users')
            .doc(firebase.auth().currentUser.uid);
        
        data = (await docRef.get()).data();

        const { email, title, firstName, lastName, gender,  displayName, phoneNo, photoURL, } = data;
        this.setState({ email, photoURL, displayName, title, firstName, lastName, gender, phoneNo, });
    }

    _onRefresh(){
        this.setState({ refreshing: true, });
        this.initialData().then(() => {
            this.setState({ refreshing: false, });
        });
    }

    handlePress = (route) => {
        this.props.navigation.navigate(route);
    }

    render(){
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

        const actionlist = [
            {
                title: '日程',
                route: 'MyAgenda', 
            },
            {
                title: '好友',
                route: 'FriendList', 
            }, 
            {
                title: '群組',
                route: 'GroupList', 
            },
            {
                title: '偏好',
                route: 'Preference', 
            },
            {
                title: '更改密碼',
                route: 'UpdateUser', 
            }, 
        ]

        navigation.setOptions({
            headerLeft: () => (
                <Icon type='material-community' name='logout' containerStyle={{ marginLeft: 15, }} onPress={() => firebase.auth().signOut() } />
            ),
            headerRight: () => (
                <Icon  name='edit' containerStyle={{ marginRight: 15, }} onPress={() => navigation.navigate('EditInfo') } />
            ),
        });

        return(
            <ScrollView styles={styles.container}
                refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this._onRefresh.bind(this)} />}
            >
                <View style={{ alignItems: 'center', marginVertical: 50, }}>
                    <Image 
                        source={photo} 
                        style={styles.image}
                    />
                    <Text style={styles.displayName}>{this.state.displayName}</Text>
                </View>
                
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

                <View style={{ marginVertical: 20, }}>
                {
                    actionlist.map((l, i) => (
                        <ListItem
                            key={i}
                            title={l.title}
                            chevron={ styles.chevron }
                            bottomDivider
                            onPress={() => this.handlePress(l.route)}
                            titleStyle={styles.actionTitle}
                        />
                    ))
                }
                </View>

                <Text style={styles.version}>{ 'CoolDay 版本: ' + APP_VERSION }</Text>
            </ScrollView>
        );
    }

}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    version: {
        color: '#8A8F9E', 
        fontWeight: 'bold',
        marginBottom: 20, 
        textAlign: 'center', 
        width: '100%',
    }, 
    displayName: { 
        textAlign: 'center', 
        fontWeight: 'bold', 
        fontSize: 20, 
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
    actionTitle: {
        textTransform: 'uppercase', 
        fontWeight: 'bold', 
        width: width * 0.7,
        fontSize: 15, 
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
    }
});