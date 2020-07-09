import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';

import { 
    View, 
    Text, 
    Image, 
    FlatList, 
    ScrollView, 
    StyleSheet, 
    Dimensions, 
    TouchableOpacity, 
} from 'react-native';
import { List, ListItem, SearchBar } from "react-native-elements";

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class SearchEventsScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchText: '', 
            loading: false, 
            afterSearch: false, 
            activitiesList: [], 
        }
    }

    async updateSearch(searchText) {
        this.setState({ searchText, loading: true, afterSearch: true });
        var activitiesList = [];

        if(searchText){
            // await firebase.firestore()
            //     .collection('Users')
            //     .orderBy('displayName')
            //     .startAt(searchText)
            //     .endAt(searchText + "\uf8ff")
            //     .get()
            //     .then(querySnapshot => {
            //         querySnapshot.forEach(function(doc) {
            //             var data = { uid: doc.id, ...doc.data() };
            //             usersInfoList = [ ...usersInfoList, data ];
            //         });
            //     });

            await firebase.database().ref('activities')
            .once("value", function(snapshot) {
                snapshot.forEach(function(doc) {
                    if(doc.val().name.includes(searchText)){
                        data = { ...doc.val() };
                        activitiesList = [ 
                            ...activitiesList, 
                            {
                                ...data
                            } 
                        ];
                    }
                });
            });
        }
        this.setState({ activitiesList: activitiesList.sort((a,b) => b.user_ratings_total - a.user_ratings_total), loading: false, afterSearch: searchText });
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

    render(){
        const { activitiesList, loading, afterSearch } = this.state;

        return(
            <>
                <SearchBar 
                    placeholder="Search"
                    onChangeText={this.updateSearch} 
                    value={this.state.searchText} 
                    showLoading={this.state.loading} 
                    onChangeText={ searchText => this.updateSearch(searchText) }
                    onClear={ () => this.setState({ afterSearch: false }) } 
                    containerStyle={styles.searchContainer} 
                    inputContainerStyle={styles.inputContainer} 
                    inputStyle={styles.inputStyle}
                />
                <View style={styles.container}>
                    { 
                        afterSearch ?
                            activitiesList.length ?
                                <ScrollView>
                                    <FlatList 
                                        keyExtractor={this.keyExtractor}
                                        data={this.state.activitiesList} 
                                        renderItem={this.renderItem} 
                                    />
                                </ScrollView>
                                :
                                <View style={{ alignItems: 'center', }}>
                                    <Text style={styles.noDataText}> 找不到活動 </Text>
                                </View>
                            :
                            <View style={{ alignItems: 'center', }}>
                                <Text style={styles.noDataText}> 搜尋活動 </Text>
                            </View>
                    } 
                </View>
            </>
        )
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
    chevron: {
        color: '#555',
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
})