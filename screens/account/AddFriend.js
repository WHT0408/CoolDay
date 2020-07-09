import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore'

import { 
    View, 
    Text, 
    Image, 
    Platform, 
    ScrollView,
    StyleSheet, 
    Dimensions, 
    ActivityIndicator, 
    TouchableOpacity, 
} from 'react-native';

import { List, ListItem, Icon, SearchBar,} from 'react-native-elements';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class AddFriend extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchText: '',
            isLoading: false, 
            afterSearch: false, 
            usersInfoList: [], 
        }
    }
    async UpdateSearch() {
        this.setState({ isLoading: true, afterSearch: true });
        const { searchText, } = this.state;
        var usersInfoList = [];

        if(searchText) {
            await firebase.firestore()
                .collection('Users')
                .orderBy('email')
                .startAt(searchText)
                .endAt(searchText + "\uf8ff")
                .get()
                .then(querySnapshot => {
                    querySnapshot.forEach(function(doc) {
                        var data = { uid: doc.id, ...doc.data() };
                        usersInfoList = [ ...usersInfoList, data ];
                    });
                });
        }
        this.setState({ usersInfoList, isLoading: false, afterSearch: searchText });
    }

    render(){
        const { usersInfoList, isLoading, afterSearch } = this.state;
        const { navigation } = this.props;

        return(
            <>
                <SearchBar 
                    placeholder='搜索電子郵件'
                    value={this.state.searchText} 
                    showLoading={this.state.isLoading} 
                    onClear={ () => this.setState({ afterSearch: false }) } 
                    containerStyle={styles.searchContainer} 
                    inputContainerStyle={styles.inputContainer} 
                    inputStyle={styles.inputStyle} 
                    onChangeText={ searchText => this.setState({ searchText }) }
                    onSubmitEditing={ () => this.UpdateSearch() } 
                    searchIcon={{ name: 'search' }} 
                    clearIcon={{ name: 'clear' }} 
                    blurOnSubmit={true}
                />

                <View style={styles.container}>
                    { 
                        afterSearch ?
                            usersInfoList.length ?
                                <ScrollView>
                                    {
                                        usersInfoList.map((item, index) => (
                                            <ListItem
                                                key={index} 
                                                contentContainerStyle={{ height:50, }} 
                                                leftAvatar={
                                                    <Image
                                                        source={ item.photoURL ? { uri: item.photoURL } : require('../../image/Default.png')}
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
                                <View style={{ alignItems: 'center', }}>
                                    <Text style={styles.noDataText}> { '找不到任何用戶' } </Text>
                                </View>
                            :
                            <View style={{ alignItems: 'center', }}>
                                <Text style={styles.noDataText}> { '找到你的好友' } </Text>
                            </View>
                    } 
                </View>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        justifyContent: 'center',
    }, 
    searchContainer: {
        backgroundColor: 'white',
        borderBottomWidth: 0.5, 
        borderBottomColor: '#ddd', 
        borderTopWidth: 0, 
    }, 
    inputContainer:{
        backgroundColor: 'white', 
    },
    inputStyle:{
        backgroundColor: 'white', 
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
    noDataText:{
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