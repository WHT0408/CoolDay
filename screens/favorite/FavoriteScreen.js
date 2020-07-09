import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';

import { 
    View, 
    Text, 
    Image, 
    FlatList, 
    ScrollView, 
    StyleSheet, 
    RefreshControl, 
    ActivityIndicator, 
} from 'react-native';

import { List, ListItem, Icon } from "react-native-elements";

export default class FavoriteScreen extends React.Component {
    constructor(props){
        super(props);
        var user = firebase.auth().currentUser;
        
        this.state = {
            activities: [], 
            loggedIn: (user) ? true : false, 
            isLoading: true, 
            refreshing: false, 
        }
    }

    componentDidMount() {
        firebase.auth().onUserChanged((user) => {
            if (user) {
                this.setState({ loggedIn: true });
                this.initialData();
            } else {
                this.setState({ loggedIn: false });
            }
        });

        this.initialData();
    }

    async initialData() {
        const user = firebase.auth().currentUser;
        const { loggedIn, } = this.state; 
        this.setState({ isLoading: true, });
        
        if (loggedIn) {
            const docRef = firebase
                .firestore()
                .collection('Users')
                .doc(user.uid);

            data = (await docRef.get()).data();
            var { favActId } = data;
            if(favActId==null)
                favActId=[];
            var activities = [];

            for(var i=0; i<favActId.length; i++){
                await firebase.database().ref('activities')
                .orderByChild('place_id')
                .startAt(favActId[i])
                .endAt(favActId[i] + "\uf8ff")
                .once("value", function(snapshot) {
                    snapshot.forEach(function(doc) {
                        data = { ...doc.val() };
                        activities = [ 
                            ...activities, 
                            {
                                ...data
                            } 
                        ];
                    });
                });
            }

            this.setState({ isLoading: false, activities: activities, });
        }
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

    keyExtractor = (item, index) => index.toString();

    renderItem = ({ item }) => {
        const { name, geometry, formatted_address, photos } = item;
        const activityType = this.getActivityType(item);
        const displayType = this.getActivityDisplayType(activityType);
        const title = "【" + displayType + "】" + name;
        const formattedAddress = formatted_address?formatted_address:"";
        const image = photos?this.getImageUrl(photos[0].photo_reference):"";
        return(
        <ListItem
            title= {title}
            subtitle={formattedAddress}
            leftAvatar={<View style={styles.center}><Image 
                        source={{uri: image?image:undefined}}
                        style={styles.listImage}
                        /></View> }
            containerStyle={styles.listcontainer}
            titleStyle={styles.listtitle}
            subtitleStyle={styles.listsubtitle}
            bottomDivider
            chevron
            onPress={() => this.props.navigation.navigate("EventDetailScreen", {
            activity: item,
            })}
        />
        )
    }

    render() {
        const { navigation } = this.props;
        const { loggedIn, isLoading, activities } = this.state;
                  
        navigation.setOptions({
            headerRight: () => (
                <Icon name='search' containerStyle={{ marginHorizontal: 15 }} disabled={!loggedIn} disabledStyle={{ display:'none', }}
                    onPress={() => navigation.navigate('SearchFav', { activities: activities, }) } 
                />
            ), 
        });

        return (
            <View>
                { 
                    !isLoading ? 
                        loggedIn ? 
                            <FlatList 
                                keyExtractor={this.keyExtractor}
                                data={this.state.activities} 
                                renderItem={this.renderItem} 
                                refreshControl={
                                    <RefreshControl
                                        refreshing={this.state.refreshing}
                                        onRefresh={this._onRefresh.bind(this)}
                                    />
                                }
                            />
                        :
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', }}>
                                <Text style={styles.noLoginText}> { '登入以收藏' } </Text>
                            </View>
                    : 
                    <ActivityIndicator />
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
    noLoginText: {
        fontWeight: 'bold', 
        alignSelf: 'center',
        fontSize: 20, 
        textAlign: 'center', 
    },
    listcontainer: {
      //height: 100,
      backgroundColor: '#F0F0F0',
      borderBottomWidth: 1,
      alignItems: 'stretch',
      justifyContent: 'center'
    },
    listtitle: {
      fontSize: 20,
      color: '#000',
      fontWeight: 'bold',
      // textShadowColor: '#BBB',
      // textShadowOffset: { width: 2, height: 2 }, 
      // textShadowRadius: 1,
      fontFamily: 'serif',
    },
    listsubtitle: {
      marginTop: 5,
      marginLeft: 10,
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