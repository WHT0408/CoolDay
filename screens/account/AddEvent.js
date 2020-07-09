import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';

import { 
    View, 
    Text, 
    Switch, 
    TextInput, 
    ScrollView, 
    StyleSheet, 
    Dimensions, 
} from 'react-native';

import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';
import { CheckBox, Icon, ListItem, } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';

const repeatList = [
    { text: '不重複', value: '', }, 
    //{ text: 'Daily', value: 'daily', }, 
    { text: '每星期', value: 'weekly', }, 
    { text: '每月', value: 'monthly', }, 
    { text: '星期一到五', value: 'weekdays', }, 
];

export default class AddEvent extends React.Component {
    constructor(props) {
        super(props);
        let isEdit = this.props.route.params.isEdit;
        let agenda = this.props.route.params.agenda;
        let event = {};

        if (isEdit) {
            event = agenda[this.props.route.params.index];
        }

        this.state = {
            isEdit: isEdit, 
            agenda: this.props.route.params.agenda, 
            startPicker: false, 
            startMode: 'date', 
            endPicker: false, 
            endMode: 'date', 
            showRepeat: false, 
            title: isEdit ? event.title : '', 
            fullDay: isEdit ? event.fullDay : false, 
            start: isEdit ? moment(event.start.toDate()) : moment(this.props.route.params.selectedDate), 
            end: isEdit ? moment(event.end.toDate()) : moment(this.props.route.params.selectedDate).add(1, 'hours'), 
            repeat: isEdit ? event.repeat : '', 
            summary: isEdit ? event.summary : '', 
        } 
    }

    async uploadEvent(event) {
        let agenda = this.state.agenda;

        if(this.state.isEdit) {
            agenda[this.props.route.params.index] = event;
        } else if (!agenda) {
            agenda = [ event, ];
        } else {
            agenda = [ ...agenda, event, ];
        }

        await firebase
            .firestore()
            .collection('Users')
            .doc(firebase.auth().currentUser.uid)
            .set({
                agenda: agenda,
            }, { merge: true, })
            .catch( error =>{
                console.log(error);
            });
    }

    handleUpload = () => {
        const { navigation } = this.props;
        const { title, fullDay, start, end, repeat, summary, } = this.state;

        var event = {           
            title: title ? title : '無標題', 
            fullDay: fullDay, 
            start: firestore.Timestamp.fromDate(start.toDate()), 
            end: firestore.Timestamp.fromDate(end.toDate()), 
            repeat: repeat, 
            summary: summary, 
        }

        if (true) {
            this.uploadEvent(event);
            navigation.goBack();
        }
    }

    renderModal() {
        return(
            <Modal 
                isVisible={this.state.showRepeat}
                onBackdropPress={ () => this.setState({ showRepeat: !this.state.showRepeat }) }
                animationIn='bounceInUp'
                animationOut='bounceOutDown' 
                useNativeDriver={true}
            >
                {
                    repeatList.map((item, index) => (
                        <ListItem 
                            key={index} 
                            leftIcon={ 
                                this.state.repeat === item.value ? 
                                { name:'radio-button-checked', color: '#FFC30B', } 
                                : 
                                { name:'radio-button-unchecked', } 
                            } 
                            title={item.text} 
                            onPress={() => {
                                this.setState({ repeat: item.value, showRepeat: !this.state.showRepeat, });
                            }}
                        />
                    ))
                }

            </Modal>
        )
    }

    render() {
        const { navigation } = this.props;
        const { startPicker, startMode, endPicker, endMode,} = this.state;

        navigation.setOptions({
 
            headerLeft: () => (
                <Icon name='clear' containerStyle={{ marginLeft: 15, }}  onPress={ () => navigation.goBack() }/>
            ), 
            headerRight: () => (
                <Icon name={this.state.isEdit ? 'save' : 'add'} containerStyle={{ marginRight: 15, }}  onPress={ this.handleUpload }/>
            ),      
        });

        return(
            <View>
                <View style={styles.input}>
                    <Icon name='title' containerStyle={styles.inputIcon} />
                    <TextInput 
                        placeholder='標題'
                        autoCapitalize="none"
                        value={this.state.title}
                        onChangeText={ title => this.setState({ title }) }
                        style={styles.inputText} 
                    ></TextInput>
                </View>

                { this.renderModal() }

                <View>
                    {
                        startPicker && (
                            <DateTimePicker
                                testID="startPicker"
                                value={this.state.start.toDate()}
                                mode={startMode}
                                is24Hour={true}
                                display="default"
                                onChange={(event, dateTime) => {
                                    if(event.type === 'set') {
                                        if (startMode === 'date' && this.state.fullDay){
                                            this.setState({ start: moment(dateTime), startPicker: !startPicker, });
                                        } else if ( startMode === 'date' ) {
                                            this.setState({ start: moment(dateTime), startMode: 'time', });
                                        } else {
                                            this.setState({ start: moment(dateTime), startMode: 'date', startPicker: !startPicker,  });
                                        }

                                        if (moment(dateTime).isAfter(this.state.end)) {
                                            this.setState({ end: moment(dateTime).add(1, 'hours') });
                                        }

                                    } else {
                                        this.setState({ startMode: 'date', startPicker: !startPicker, });
                                    }
                                }}
                            />
                        )
                    }
                    {

                        endPicker && (
                            <DateTimePicker
                                testID="endPicker"
                                value={this.state.end.toDate()}
                                mode={endMode}
                                is24Hour={true}
                                display="default"
                                onChange={(event, dateTime) => {
                                    if(event.type === 'set') {
                                        if ( moment(dateTime).isSameOrAfter(this.state.start) ) {
                                            if (endMode === 'date' && this.state.fullDay) {
                                                this.setState({ end: moment(dateTime), endPicker: !endPicker, });
                                            } else if ( endMode === 'date' ) {
                                                this.setState({ end: moment(dateTime), endMode: 'time', });
                                            } else {
                                                this.setState({ end: moment(dateTime), endMode: 'date', endPicker: !endPicker,  });
                                            }
                                        } else {
                                            alert('End datetime should not set before start');
                                        }
                                    } else {
                                        this.setState({ endMode: 'date', endPicker: !endPicker, });
                                    }
                                }}
                            />
                        )
                    }
                </View>

                <View style={styles.timestampContainer}>
                    <ListItem
                        leftIcon={{ 
                            name: 'schedule',
                        }}
                        title='全日' 
                        rightElement={
                            <Switch onValueChange={ (fullDay) => this.setState({ fullDay })} value={this.state.fullDay} />
                        }
                    />

                    <ListItem 
                        leftIcon={{ 
                            name: 'schedule', 
                            color: 'transparent', 
                        }}
                        title={this.state.start.format('YYYY/MM/DD ddd')} 
                        rightTitle={this.state.fullDay ? '' : this.state.start.format('HH:mm')} 
                        onPress={ () => this.setState({ startPicker: true }) }
                    />

                    <ListItem 
                        leftIcon={{ 
                            name: 'schedule', 
                            color: 'transparent', 
                        }}
                        title={this.state.end.format('YYYY/MM/DD ddd')} 
                        rightTitle={this.state.fullDay ? '' : this.state.end.format('HH:mm')} 
                        onPress={ () => this.setState({ endPicker: true }) }
                    />

                    <ListItem
                        leftIcon={{ 
                            name: 'refresh', 
                        }}
                        title={ repeatList.find((item) => item.value === this.state.repeat).text } 
                        titleStyle={ styles.repeatText }
                        onPress={ () => this.setState({ showRepeat: !this.state.showRepeat }) }
                    />
                </View>

                <View style={styles.input}>
                    <Icon name='text' type='material-community' containerStyle={styles.inputIcon} />
                    <TextInput 
                        placeholder='備註' 
                        autoCapitalize="none" 
                        value={this.state.summary}
                        onChangeText={ summary => this.setState({ summary }) }
                        style={styles.inputText} 
                    ></TextInput>
                </View>

            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }, 
    timestampContainer: {
        borderColor: '#8A8F9E', 
        borderBottomWidth: StyleSheet.hairlineWidth, 
    }, 
    repeatText: {
        textTransform: 'capitalize',
    }, 
    input: {
        flexDirection: 'row', 
        backgroundColor: '#fff', 
        borderColor: '#8A8F9E', 
        borderBottomWidth: StyleSheet.hairlineWidth, 
    }, 
    inputIcon:{
        paddingVertical: 15,
        paddingLeft: 15,
    }, 
    inputText: {
        color: '#161F30', 
        fontSize: 15, 
        padding: 15,
    }, 
});