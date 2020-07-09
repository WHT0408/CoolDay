import React, { PureComponent } from 'react';
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

export default class FriendList extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            info: {}, 
            friendInfoList: [], 
            isLoading: true, 
            refreshing: false, 
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        this.setState({ isLoading: true });
        var friendId = [];
        var friendInfoList = [];

        await firebase
            .firestore()
            .collection('Users')
            .doc(firebase.auth().currentUser.uid)
            .get()
            .then(doc => {
                friendId = doc.data().friendId;
                this.setState({ info: doc.data() });
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
                        this.setState({ friendInfoList, });
                    });
            }
        }

        this.setState({ isLoading: false });
    }

    _onRefresh(){
        this.setState({ refreshing: true, });
        this.initialData().then(() => {
            this.setState({ refreshing: false, });
        });
    }

    render(){
        const { navigation } = this.props;
        const { info, friendInfoList, isLoading, } = this.state;

        navigation.setOptions({
            headerRight: () => (
                <Icon name='person-add' containerStyle={{ marginRight: 15, }} onPress={() => navigation.navigate('AddFriend') } />
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
                                    title={item.displayName} 
                                    titleStyle={styles.displayName} 
                                    chevron={styles.chevron} 
                                    bottomDivider 
                                    onPress={ () => navigation.navigate('UserInfo', { infos: item, }) }
                                />
                            ))
                        }
                    </ScrollView>

                    :

                    <View style={[styles.container, { justifyContent: 'center', }]}>
                        <Icon type='material-community' name='emoticon-cry' size={55} color='#edac00' />
                        <Text style={styles.noFriendText}> { '沒有好友' } </Text>
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
    chevron: {
        color: '#555',
    }, 
});