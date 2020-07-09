import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';

import { 
    View, 
    Text, 
    Image, 
    FlatList, 
    ScrollView, 
    Dimensions, 
    StyleSheet, 
    TouchableOpacity, 
    ActivityIndicator, 
} from 'react-native';
import { List, ListItem, SearchBar } from "react-native-elements";

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class SearchScheduleScreen extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            activities: [],
            actLoading: true,
            
            searchText: '',
            loading: false, 
            afterSearch: false, 
            itinerariesList: [], 
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        firebase.database().ref('activities').on('value', (snapshot) => {
            let activities = snapshot.val();
        
            this.setState({
                actLoading: false,
                activities: activities,
            });
        });
      }

    async updateSearch(searchText) {
        this.setState({ searchText, loading: true, afterSearch: true });
        var itinerariesList = [];

        if(searchText){
            await firebase.firestore()
                .collection('itineraries')
                .get()
                .then(querySnapshot => {
                    querySnapshot.forEach(function(doc) {
                        if(doc.data().name.includes(searchText)){
                            var data = { id: doc.id, ...doc.data() };
                            itinerariesList = [ ...itinerariesList, data ];
                        }
                    });
                });

        }
        this.setState({ itinerariesList: itinerariesList, loading: false, afterSearch: searchText });
    }

    keyExtractor = (item, index) => index.toString();

    renderItem = ({ item }) => {
        const { name, startDateTime, endDateTime, minMember, maxMember, activities } = item;
        const displayStartDay = moment(startDateTime.toDate().toString()).format('DD/MM/YYYY');
        const displayStartTime = moment(startDateTime.toDate().toString()).format('HH:mm');
        const displayEndTime = moment(endDateTime.toDate().toString()).format('HH:mm');
        const period = displayStartDay + " ‧ " + displayStartTime;
        const firstActId = activities[0].place_id;
        const firstAct = this.getFirstAct(firstActId);
        const imgRef = firstAct.photos?firstAct.photos[0].photo_reference:"";
        const img = firstAct.photos?this.getImageUrl(imgRef):"";
        //const img = "";
  
        return(
        <TouchableOpacity onPress={() => this.props.navigation.navigate("ScheduleDetailScreen", {
          itinerary: item,
        })}>
        <Image style={styles.image} source={{ uri: firstAct.photos && img ? img : undefined  }}>
        </Image>
        {/* <Text style={styles.listtitle}>{name}</Text>
        <View style={styles.description}>
          <Text>{displayStartDay} ‧ {displayStartTime}</Text>
          <Text style={styles.desc2}>{minMember} - {maxMember} 人</Text>
        </View> */}
        <ListItem
          title={name}
          subtitle={`${displayStartDay} ‧ ${displayStartTime} - ${displayEndTime}`}
          rightTitle=""
          rightSubtitle={`${minMember} - ${maxMember} 人`}
          titleStyle={styles.listtitle}
          containerStyle={styles.listcontainer}
          bottomDivider
        />
        </TouchableOpacity>
  
        )
    }

    getFirstAct(id){
        const { activities } = this.state;
        let firstAct = {};
        for(var i=0; i<activities.length; i++){
          if(id == activities[i].place_id)
              firstAct = activities[i];
        }
        return firstAct;
    }

    getImageUrl(photoRef){
        const url = "https://maps.googleapis.com/maps/api/place/photo?";
        const maxwidth = `maxwidth=400`;
        const photoreference = `&photoreference=${photoRef}`;
        const api_key = `&key=AIzaSyBhKUnbXmXD3eXdWP3iHspHFs73E1MjUF0`;
        return `${url}${maxwidth}${photoreference}${api_key}`;
    }

    render(){
        const { actLoading, itinerariesList, loading, afterSearch } = this.state;

        if(!actLoading){
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
                                itinerariesList.length ?
                                    <ScrollView>
                                        <FlatList 
                                            keyExtractor={this.keyExtractor}
                                            style={styles.flatlist} 
                                            data={this.state.itinerariesList} 
                                            renderItem={this.renderItem}
                                        />
                                    </ScrollView>
                                    :
                                    <View style={{ alignItems: 'center', }}>
                                        <Text style={styles.noDataText}> 找不到行程 </Text>
                                    </View>
                                :
                                <View style={{ alignItems: 'center', }}>
                                    <Text style={styles.noDataText}> 搜尋行程 </Text>
                                </View>
                        } 
                    </View>
                </>
            )
        }
        else{
            return <ActivityIndicator />
        }
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
    flatlist: {
        width: width,
        height: height/100*78,
        flexGrow: 0,
    },
    listcontainer: {
        backgroundColor: '#f2f2f2',
        borderBottomWidth: 1,
    },
    listtitle: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#000',
    },
    image: {
        overflow: 'hidden',
        borderRadius: 16,
        width: width/100*95,
        height: height/100*28,
        marginBottom: 0,
        margin: 10,
    },
})