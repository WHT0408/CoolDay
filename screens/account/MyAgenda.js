import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';
import 'moment/locale/zh-hk';

import { 
    View, 
    Text, 
    ScrollView, 
    StyleSheet, 
    Dimensions, 
    RefreshControl, 
    ActivityIndicator, 
    TouchableOpacity, 
} from 'react-native';

import { Icon, ListItem, } from 'react-native-elements';
import { Calendar, LocaleConfig, } from 'react-native-calendars';

const width = Dimensions.get('window').width; //full width
const height = Dimensions.get('window').height; //full height

var isHidden = true;

export default class MyAgenda extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            agenda: [], 
            events: {}, 
            markedDates: null, 
            refreshing: false, 
            calenderOn: false, 
            selectedDate: moment().format('YYYY-MM-DD'), 
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        var agenda = [];
        await firebase
            .firestore()
            .collection('Users')
            .doc(firebase.auth().currentUser.uid)
            .get()
            .then( doc => {
                agenda = agenda.sort((a,b) => a.start.toDate() - b.start.toDate() );
                agenda = doc.data().agenda;
                
                this.setState({ agenda });
            });
        this.setData();
    }

    _onRefresh(){
        this.setState({ refreshing: true, });
        this.initialData().then(() => {
            this.setData();
            this.setState({ refreshing: false, });
        });
    }

    setData() {
        var markedDates = {}, events = {};
        const { agenda } = this.state;

        if (agenda && agenda.length) {
            agenda.forEach( (event, index) => { 
                const startDate = moment(event.start.toDate());
                const endDate = moment(event.end.toDate());

                if (event.repeat === 'weekdays') {
                    for (var date = startDate.clone(); date.isSameOrBefore(endDate); date = date.add(1, 'days')) {
                        if ( !(date.weekday() === 0 || date.weekday() === 6 ) ) {
                            var dateText = date.format('YYYY-MM-DD');
                            markedDates[dateText] = { marked: true, dotColor: '#FFC30B', };
                            events[dateText] = ( events[dateText] && events[dateText].length ) ? [ ...events[dateText], { ...event, index: index, } ] : [ { ...event, index: index, } ];
                        }
                    }
                } else if (event.repeat === 'weekly') {
                    for (var date = startDate.clone(); date.isSameOrBefore(endDate); date = date.add(1, 'days')) {
                        if ( date.weekday() === startDate.weekday() ) {
                            var dateText = date.format('YYYY-MM-DD');
                            markedDates[dateText] = { marked: true, dotColor: '#FFC30B', };
                            events[dateText] = ( events[dateText] && events[dateText].length ) ? [ ...events[dateText], { ...event, index: index, } ] : [ { ...event, index: index, } ];
                        }
                    }
                } else if (event.repeat === 'monthly') {
                    for (var date = startDate.clone(); date.isSameOrBefore(endDate); date = date.add(1, 'days')) {
                        if ( date.date() === startDate.date() ) {
                            var dateText = date.format('YYYY-MM-DD');
                            markedDates[dateText] = { marked: true, dotColor: '#FFC30B', };
                            events[dateText] = ( events[dateText] && events[dateText].length ) ? [ ...events[dateText], { ...event, index: index, } ] : [ { ...event, index: index, } ];
                        }
                    }
                } else {
                    for (var date = startDate.clone(); date.isSameOrBefore(endDate); date = date.add(1, 'days')) {
                        var dateText = date.format('YYYY-MM-DD');
                        markedDates[dateText] = { marked: true, dotColor: '#FFC30B', };
                        events[dateText] = ( events[dateText] && events[dateText].length ) ? [ ...events[dateText], { ...event, index: index, } ] : [ { ...event, index: index, } ];
                    }
                }
            });
        }

        this.setState({ markedDates, events });
    }

    render() {
        const { navigation } = this.props;
        const { agenda, events, selectedDate } = this.state;

        navigation.setOptions({
            headerRight: () => (
                <Icon name='calendar-plus' type='material-community' containerStyle={{ marginRight: 15, }}  onPress={ () => navigation.navigate('AddEvent', { agenda: agenda, selectedDate: selectedDate }) }/>
            ),        
        });

        LocaleConfig.locales['hk'] = {
            monthNames: ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
            monthNamesShort: ['一','二','三','四','五','六','七','八','九','十','十一','十二'],
            dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
            dayNamesShort: ['日','一','二','三','四','五','六'],
            today: '今日',
        };

        LocaleConfig.defaultLocale = 'hk';

        return(
            <View style={styles.container}>

                <View style={this.state.calenderOn ? { position: 'absolute', width: width }: { display: 'none', }}>
                    <Calendar
                        markedDates={this.state.markedDates} 
                        onDayPress={(date) => this.setState({ selectedDate: date.dateString, calenderOn: !this.state.calenderOn, })} 
                        headerStyle={{ backgroundColor: '#FFC30B', }}
                        hideExtraDays={true} 
                        theme={{
                            todayTextColor: 'red', 
                            textSectionTitleColor: 'white', 
                            textDayHeaderFontWeight: 'bold', 
                            monthTextColor: 'white', 
                            textMonthFontSize: 20, 
                            textMonthFontWeight: 'bold', 
                            arrowColor: 'white', 
                            dotColor: '#FFC30B', 
                        }}
                    />
                    <View style={{ backgroundColor: 'white', }}>
                        <TouchableOpacity 
                            style={styles.closeCalendar} 
                            onPress={ () =>  this.setState({ calenderOn: !this.state.calenderOn }) }
                        >
                            <Icon name='arrow-drop-up' color='white'/>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.monthHeader} 
                    activeOpactity={1}
                    onPress={ () =>  this.setState({ calenderOn: !this.state.calenderOn }) }
                >
                    <Icon name='calendar' type='material-community' color='transparent' />
                    <Text style={styles.monthHeaderText}>{ moment(selectedDate).format(' MMMM YYYY ') }</Text>
                    <Icon name='calendar' type='material-community' color='white' />
                </TouchableOpacity>

                {
                    events && events[selectedDate] ?
                        <View style={{ flexDirection: 'row', zIndex: -2, }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', width: 75, height: 75, }}>
                                <Text style={styles.showingDay}>{ moment(selectedDate).format('DD') }</Text>
                                <Text style={styles.showingDay}>{ moment(selectedDate).format('ddd') }</Text>
                            </View>
                        
                            <ScrollView 
                                style={styles.dayContainer}
                                refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this._onRefresh.bind(this)} />}
                            >
                                {
                                    events[selectedDate].map((event, index) => (
                                        <ListItem
                                            key={index} 
                                            leftElement={
                                                <View key={index}>
                                                    <Text style={styles.eventTime}>{
                                                        moment(event.start.toDate()).format(event.start.toDate().getFullYear() !== event.end.toDate().getFullYear() ? 'MM/DD/YYYY' : 'MM/DD')
                                                        + ' - ' 
                                                        + moment(event.end.toDate()).format(event.start.toDate().getFullYear() !== event.end.toDate().getFullYear() ? 'MM/DD/YYYY' : 'MM/DD')
                                                    }</Text>
                                                    <Text style={styles.eventTime}>{
                                                        event.fullDay ? '全日' : 
                                                        moment(event.start.toDate()).format('hh:mm A') 
                                                        + ' - ' 
                                                        + moment(event.end.toDate()).format('hh:mm A')
                                                    }</Text>
                                                    <Text style={styles.eventTitle}>{event.title}</Text>
                                                    <Text style={styles.eventDetail}>{event.summary}</Text>
                                                </View>
                                            } 
                                            containerStyle={styles.eventContainer} 
                                            rightIcon={{ 
                                                name: 'edit', 
                                                onPress: () => { navigation.navigate('AddEvent', { agenda: agenda, isEdit: true, index: event.index }) } 
                                            }}
                                        />
                                    ))
                                }
                            </ScrollView>
                        </View>
                    :
                    (
                        <View style={[styles.noEventContainer, { zIndex:-2, }]}>
                            <ScrollView
                                contentContainerStyle={ styles.noEventContainer }
                                refreshControl={<RefreshControl refreshing={this.state.refreshing} onRefresh={this._onRefresh.bind(this)} />}
                            >
                                <Text style={styles.noEvent}> {'沒有活動'} </Text>
                            </ScrollView>
                        </View>
                    )
                }

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    monthHeader: {
        justifyContent: 'center', 
        backgroundColor: '#FFC30B', 
        flexDirection: 'row', 
        marginHorizontal: 6, 
        paddingVertical: 15, 
        zIndex: -1, 
    }, 
    monthHeaderText: {
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 20, 
    }, 
    showingDay: {
        color: '#FFC30B', 
        fontSize: 20, 
    }, 
    closeCalendar: {
        alignItems: 'center',
        backgroundColor: '#FFC30B', 
        borderBottomLeftRadius: 2.5, 
        borderBottomRightRadius: 2.5, 
        marginHorizontal: 6, 
        paddingVertical: 15, 
        zIndex: 0, 
    }, 
    dayContainer: {
        flex: 1,
        marginHorizontal: 6,
    },
    eventContainer: {
        flex: 1, 
        backgroundColor: 'white', 
        borderRadius: 5, 
        paddingVertical:10, 
        paddingHorizontal: 15, 
        minHeight: 100, 
        marginTop: 5, 
    }, 
    eventTime: {
        fontSize: 18, 
    }, 
    eventTitle: {
        fontSize: 18, 
        fontWeight:'bold', 
    }, 
    eventDetail: {
        fontSize: 15, 
    }, 
    noEventContainer: {
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
    }, 
    noEvent: {
        fontSize: 20, 
        fontWeight:'bold', 
    }, 
    subView: {
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: "#FFFFFF", 
        zIndex: 0, 
    }, 
});