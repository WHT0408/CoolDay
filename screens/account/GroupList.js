import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'

import { 
    View, 
    Text, 
    Image, 
    Alert, 
    Button,
    TextInput, 
    ScrollView,
    StyleSheet, 
    Dimensions, 
    RefreshControl, 
    ActivityIndicator, 
    TouchableOpacity,
} from 'react-native';
import Modal from 'react-native-modal';
import { List, ListItem, Icon, } from 'react-native-elements';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class GroupList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            groupName: '', 
            groupInfoList: [], 
            isLoading: true, 
            refreshing: false, 
            isDialogShow: false, 
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        this.setState({ isLoading: true });
        var groupId = [];
        var groupInfoList = [];

        await firebase
            .firestore()
            .collection('Users')
            .doc(firebase.auth().currentUser.uid)
            .get()
            .then(doc => {
                groupId = doc.data().groupId;
            });
            
        
        if (groupId && groupId.length > 0) {
            for (var index = 0; index < groupId.length; index = index + 10 ) {
                var slice = groupId.slice(index, (index + 10 < groupId.length) ? index + 10 : groupId.length);
                await firebase.firestore()
                    .collection('FriendGroup')
                    .where('__name__', 'in', slice)
                    .get()
                    .then(querySnapshot => {
                        querySnapshot.forEach(function(doc) {
                            var data = { gid: doc.id, groupName: doc.data().groupName, photoURL: doc.data().photoURL };
                            groupInfoList = [ ...groupInfoList, data ];
                        });
                        this.setState({ groupInfoList, });
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

    toggleDialog = () => {
        this.setState({ isDialogShow: !this.state.isDialogShow, });
    }

    renderDialog() {
        return(
            <Modal 
                isVisible={this.state.isDialogShow}
                style={styles.dialog}
                onBackdropPress={ this.toggleDialog }
                onModalHide={ () => this.setState({ groupName: '' })}
                animationIn='bounceInUp'
                animationOut='bounceOutDown' 
                animationInTiming={0}
                animationOutTiming={0}
                useNativeDriver={true}
            >
                <View style={{flex: 1}}>
                    <Text style={styles.dialogTitle}>{'輸入群組名稱'}</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder='群組名稱'
                        autoCapitalize="none"
                        onChangeText={ groupName => this.setState({groupName}) } 
                        value={this.state.groupName}
                        ref={ (input) => { this.nameInput = input; } }
                    />

                    <View style={styles.dialogOptions}>
                        <TouchableOpacity onPress={ this.createGroup }><Text style={styles.buttonText}> { '創建' } </Text></TouchableOpacity>
                        <TouchableOpacity onPress={ this.toggleDialog }><Text style={styles.buttonText}> { '取消' } </Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        )
    }

    createGroup = () => {
        const { groupName } = this.state;

        if(groupName) {
            this.toggleDialog();

            const uid = firebase.auth().currentUser.uid;

            var data = {
                groupName: groupName,
                createdBy: uid,
                admin: [ uid, ],
                members: [ uid, ],
                isCreatedAt: firebase.firestore.Timestamp.now(),
                photoURL: '',
            };

            firebase
                .firestore()
                .collection('FriendGroup')
                .add(data)
                .then(doc => {
                    firebase
                        .firestore()
                        .collection('Users')
                        .doc(uid)
                        .update({ groupId: firestore.FieldValue.arrayUnion(doc.id) });
                });

            this.initialData();
        } else{
            Alert.alert("警告", "請輸入群組名稱", [{ text: "Cancel", style: "cancel" },], { cancelable: false });
        }
    }

    render() {
        const { navigation } = this.props;
        const { info, groupInfoList, isLoading,  } = this.state;

        if (firebase.auth().currentUser) {
            navigation.setOptions({
                headerRight: () => (
                    <Icon name='group-add' containerStyle={{ marginRight: 15, }} onPress={ this.toggleDialog } />
                ), 
            });
        }

        return(
            !isLoading ?
                groupInfoList.length ?
                    <ScrollView style={styles.container}
                        refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this._onRefresh.bind(this)} />}
                    >
                        { this.renderDialog() }
                        {
                            groupInfoList.map((item, index) => (
                                <ListItem
                                    key={index} 
                                    contentContainerStyle={{ height:50, }} 
                                    leftAvatar={
                                        <Image 
                                            source={item.photoURL ? { uri: item.photoURL } : require('../../image/Default.png')}
                                            style={styles.listImage}
                                        /> 
                                    }
                                    title={item.groupName} 
                                    titleStyle={styles.groupName} 
                                    chevron={styles.chevron} 
                                    bottomDivider 
                                    onPress={ () => navigation.navigate('GroupInfo', { gid: item.gid }) }
                                />
                            ))
                        }
                    </ScrollView>
                    :
                    <View style={[styles.container, { justifyContent: 'center', }]}>
                        <Icon type='material-community' name='emoticon-cry' size={55} color='#edac00' />
                        <Text style={styles.noGroupText}> {'您不在任何群組中'} </Text>
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
        color: '#555', 
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
    input: {
        borderBottomColor: "#8A8F9E",
        borderBottomWidth: StyleSheet.hairlineWidth,
        height: 40,
        fontSize: 15,
        color: "#161F30", 
        margin: 12,
    }, 
    buttonText: {
        color: '#062', 
        textDecorationStyle: 'solid',
        fontSize: 15,
        margin: 10, 
    },
    groupName: {
        fontWeight: 'bold', 
    }, 
    noGroupText:{
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