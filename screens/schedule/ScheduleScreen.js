import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';

import { 
  View, 
  Text, 
  Image, 
  Picker, 
  FlatList, 
  ListView, 
  StyleSheet, 
  Dimensions, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator, 
} from 'react-native';

import { Icon, List, ListItem } from "react-native-elements";
import { CustomPicker } from 'react-native-custom-picker';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height


export default class ScheduleScreen extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        actLoading: true,
        itiLoading: true,
        refreshing: false,
        // filter: '1week',
        filter: {
          label: '3個月',
          value: '3months',
        },
        itineraries: [],
        activities: [],
      }
    }

    componentDidMount() {
      this.initialData();
    }

    async initialData() {
      const docRef = firebase.firestore().collection('itineraries');
      docRef.onSnapshot((snapshot) => {
        const itineraries = [];
        snapshot.forEach(doc => {
          const data = doc.data();

          const itineraryList = {};
          itineraryList['id'] = doc.id;
          itineraryList['name'] = data.name;
          itineraryList['startDateTime'] = data.startDateTime.toDate().toString();
          itineraryList['endDateTime'] = data.endDateTime.toDate().toString();
          itineraryList['minMember'] = data.minMember;
          itineraryList['maxMember'] = data.maxMember;
          itineraryList['activities'] = data.activities;
          itineraryList['userId'] = data.userId;
          itineraryList['travelMode'] = data.travelMode;
          itineraries.push(itineraryList);
        });
        this.setState({
          itiLoading: false,
          itineraries: itineraries,
        });
      });


      firebase.database().ref('activities').on('value', (snapshot) => {
          let activities = snapshot.val();
      
          this.setState({
              actLoading: false,
              activities: activities,
          });
      });
    }

    getFilterSchedule(filter){
      const sections = [];
      const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
      const currentDate = moment().format('YYYY-MM-DD');
      const currentTime = moment().format('HH:mm:ss');
  
      const oneMonthDateNum = this.getOneMonthDayNum();
      const threeMonthsDateNum = this.getThreeMonthsDayNum();
  
      const oneWeekDate = moment(currentDate).add(7, 'days').startOf('day').format('YYYY-MM-DD');
      const oneMonthDate = moment(currentDate).add(oneMonthDateNum, 'days').startOf('day').format('YYYY-MM-DD');
      const threeMonthsDate = moment(currentDate).add(threeMonthsDateNum, 'days').startOf('day').format('YYYY-MM-DD');
      const oneYearDate = moment(currentDate).add(365, 'days').startOf('day').format('YYYY-MM-DD');
  
      for(var i=0; i<this.state.itineraries.length; i++){
        const itineraryDateTime = moment(this.state.itineraries[i].startDateTime).format('YYYY-MM-DD HH:mm:ss');
        const itineraryDate = moment(this.state.itineraries[i].startDateTime).format('YYYY-MM-DD');
        const itineraryTime = moment(this.state.itineraries[i].startDateTime).format('HH:mm:ss');
        if(filter == 'today'){
          if(currentDate == itineraryDate && currentTime < itineraryTime){
            sections.push(this.state.itineraries[i]);
          }
        }
        else if(filter == '1week'){
          if(currentDate <= itineraryDate && oneWeekDate > itineraryDate){
            sections.push(this.state.itineraries[i]);
          }
        }
        else if(filter == '1month'){
          if(currentDate <= itineraryDate && oneMonthDate > itineraryDate){
            sections.push(this.state.itineraries[i]);
          }
        }
        else if(filter == '3months'){
          if(currentDate <= itineraryDate && threeMonthsDate > itineraryDate){
            sections.push(this.state.itineraries[i]);
          }
        }
        else if(filter == '1year'){
          if(currentDate <= itineraryDate && oneYearDate > itineraryDate){
            sections.push(this.state.itineraries[i]);
          }
        }
      }
      return sections.sort((a,b) => moment(a.startDateTime).format('YYYYMMDDHHmmss') - moment(b.startDateTime).format('YYYYMMDDHHmmss') );
    }

    getOneMonthDayNum(){
      const month = moment().format('MM');
      if(month == '2')
        return 29;
      else if(month == '04' || month == '06' || month == '09' || month == '11')
        return 30;
      else if(month == '01' || month == '03' || month == '05' || month == '07' || month == '08' || month == '10' || month == '12')
        return 31;
    }
  
    getThreeMonthsDayNum(){
      const month = moment().format('MM');
      if(month == '02' || month == '12')
        return 90;
      else if(month == '01' || month == '04' || month == '09' || month == '04')
        return 91;
      else if(month == '03' || month == '05'  || month == '06' || month == '07' || month == '08' || month == '10' || month == '11')
        return 92;
    }

    renderPicker(){
      const {filter} = this.state;
      const options = [
        {
          color: 'black',
          label: '今天',
          value: 'today',
        },
        {
          color: 'black',
          label: '一星期',
          value: '1week',
        },
        {
          color: 'black',
          label: '一個月',
          value: '1month',
        },
        {
          color: 'black',
          label: '三個月',
          value: '3months',
        },
        {
          color: 'black',
          label: '一年',
          value: '1year',
        },
      ]
      return(
        <View style={styles.picker}>
          <CustomPicker
            modalAnimationType="fade"
            modalStyle={styles.optionsModel}
            placeholder={filter.label}
            options={options}
            getLabel={(item) => item.label}
            fieldTemplate={this.renderField}
            headerTemplate={this.renderHeader}
            optionTemplate={this.renderOption}
            onValueChange={(item) => {
                this.setState({
                  filter: item
                })
            }}
          />
        </View>
      )
    }

    renderField(settings) {
      const { selectedItem, defaultText, getLabel, clear } = settings
      return (
        <View style={styles.pickerContainer}>
          <View>
            {!selectedItem && (
              <View style={styles.innerContainer}>
              <Text style={[styles.pickerText, { color: '#000' }]}>
                {defaultText}
              </Text>
              <Icon name="arrow-drop-down" size={30} color={'black'} />
              </View>
            )}
            {selectedItem && (
              <View style={styles.innerContainer}>
                <Text style={[styles.pickerText, { color: selectedItem.color }]}>
                  {getLabel(selectedItem)}
                </Text>
                <Icon name="arrow-drop-down" size={30} color={'black'} />
              </View>
            )}
          </View>
        </View>
      )
    }

    renderHeader() {
      return (
        <View style={styles.headerFooterContainer}>
          <Text style={styles.headerText}>篩選日期:</Text>
        </View>
      )
    }

    renderOption(settings) {
      const { item, getLabel } = settings
      return (
        <View style={styles.optionContainer}>
          <View style={styles.optionInnerContainer}>
            <View style={[styles.box, { backgroundColor: item.color }]} />
            <Text style={{ color: item.color, alignSelf: 'center' }}>{getLabel(item)}</Text>
          </View>
        </View>
      )
    }
    
    keyExtractor = (item, index) => index.toString()

    renderItem = ({ item }) => {
      const { name, startDateTime, endDateTime, minMember, maxMember, activities } = item;
      const displayStartDay = moment(startDateTime).format('DD/MM/YYYY');
      const displayStartTime = moment(startDateTime).format('HH:mm');
      const displayEndTime = moment(endDateTime).format('HH:mm');
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

    handleRefresh = () => {
      this.setState({ refreshing: true, });
      this.initialData().then(() => {
          this.setState({ refreshing: false, });
      });
    }

    render() {
        const { navigation } = this.props;
        const { actLoading, itiLoading } = this.state;
        const { filter } = this.state;
        //const { item } = this.props.route.params.filter
        navigation.setOptions({
          headerRight: () => (
            <Icon name='search' size={30} containerStyle={{ marginHorizontal: 15 }} onPress={() => navigation.navigate('SearchSchedule') } />
          ), 
        });

        if(!actLoading && !itiLoading){
          return (
            <View>
                {this.renderPicker()}
                <SafeAreaView>
                  <FlatList 
                    keyExtractor={this.keyExtractor}
                    style={styles.flatlist} 
                    data={this.getFilterSchedule(filter.value)} 
                    renderItem={this.renderItem}
                    refreshing={this.state.refreshing}
                    onRefresh={this.handleRefresh}
                  />
                </SafeAreaView>
            </View>
          );
        }
        else{
            return <ActivityIndicator />
        }
    }
}

const styles = StyleSheet.create({
  picker: {
    marginLeft: 160, 
    marginRight: 160,
  },
  flatlist: {
    width: width,
    height: height/100*78,
    flexGrow: 0,
  },
  row: {
    margin: 10
  },
  image: {
    overflow: 'hidden',
    borderRadius: 16,
    width: width/100*95,
    height: height/100*28,
    marginBottom: 0,
    margin: 10,
  },
  description: {
    flexDirection: "row",
  },
  desc2: {
    marginLeft: 230,
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
  optionsModel: {
    marginHorizontal: 70,
  },
  pickerContainer: {
    // borderColor: 'grey',
    // borderWidth: 1,
    padding: 15,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  pickerText: {
    fontSize: 18,
    // alignSelf: 'center',
  },
  headerFooterContainer: {
    padding: 10,
    alignItems: 'center'
  },
  headerText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 20,
  },
  optionContainer: {
    padding: 30,
    marginHorizontal: 40,
    borderBottomColor: 'grey',
    borderBottomWidth: 1,
  },
  optionInnerContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  box: {
    // width: 20,
    // height: 20,
    // marginRight: 10,
    alignItems: 'center',
  }

});