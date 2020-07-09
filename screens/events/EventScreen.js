import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';

import { 
    View, 
    Text, 
    Image, 
    FlatList, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    ActivityIndicator, 
} from 'react-native';

import { List, ListItem } from "react-native-elements";

export default class eventScreen extends React.PureComponent {
    constructor(props) {
      super(props);

      this.state = {
        loading: true,
        activities: [],
        sort: {
          label: '熱門',
          value: 'hot',
        },
        refreshing: false,
      }
    }

    componentDidMount() {
      this.initialData();
    }

    async initialData() {
      firebase.database().ref('activities').on('value', (snapshot) => {
        let activities = snapshot.val();
    
        this.setState({
            loading: false,
            activities: activities,
        });
      });
    }

    getFilterActivity(activities, filter){
        const sections = [];
        let activityType;

        for(var i=0; i<activities.length; i++){
          activityType = this.getActivityType(activities[i]);
          if(filter == 'All'){
            sections.push(activities[i]);
          }
          else{
            if(activityType == filter){
              sections.push(activities[i]);
            }
          }
        }
        //this.props.navigation.navigation.setOptions({title:'List' + filter});
        return sections;
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

    getSortedAct(sort){
      const activities = this.state.activities;
      if(sort == 'hot')
        activities.sort((a,b) => b.user_ratings_total - a.user_ratings_total);
      else if(sort == 'recommend')
        activities.sort((a,b) => b.rating - a.rating);
      return activities;
    }

    handleRefresh = () => {
      this.setState({ refreshing: true, });
      this.initialData().then(() => {
          this.setState({ refreshing: false, });
      });
    }

    render() {
      const { loading } = this.state;
      const { sort, filter } = this.props.route.params;
      let activities = this.getSortedAct(sort);

        if(!loading){

          return(
            <SafeAreaView>
                <FlatList 
                  keyExtractor={this.keyExtractor}
                  data={this.getFilterActivity(activities, filter)} 
                  renderItem={this.renderItem} 
                  refreshing={this.state.refreshing}
                  onRefresh={this.handleRefresh}
                />
            </SafeAreaView>
          )
        }
        else{
          return <ActivityIndicator />
        }
    }

}

const styles = StyleSheet.create({

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

