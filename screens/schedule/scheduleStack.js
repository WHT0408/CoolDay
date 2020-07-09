import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

import ScheduleScreen from './ScheduleScreen';
import ScheduleDetailScreen from './ScheduleDetailScreen';
import EventDetailScreen from '../events/EventDetailScreen';
import ScheduleMapScreen from './ScheduleMapScreen';
import ScheduleAddScreen from './ScheduleAddScreen';
import SearchScheduleScreen from './SearchScheduleScreen';
import UserInfo from '../account/UserInfo';

export class ScheduleStack extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loggedIn: false
        }
    }

    componentDidMount() {
        firebase.auth().onUserChanged((user) => {
            if(user){
                this.setState({ loggedIn: true})
            } else {
                this.setState({ loggedIn: false})
            }
        })
    }

    render() {
        const Stack = createStackNavigator();

        return (
            <Stack.Navigator screenOptions={{
                headerTitleAlign: 'center',
                headerStyle: {
                    //backgroundColor: '#FFAA1D',
                },
                headerTintColor: '#000',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}>
                <Stack.Screen name="schedule" component={ScheduleScreen} options={{ title: '行程', }} />
                <Stack.Screen name="ScheduleDetailScreen" component={ScheduleDetailScreen} />
                <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
                <Stack.Screen name="ScheduleMapScreen" component={ScheduleMapScreen} />
                <Stack.Screen name="ScheduleAddScreen" component={ScheduleAddScreen} options={{ title: '新增行程', }} />
                <Stack.Screen name="UserInfo" component={UserInfo} />
                <Stack.Screen name="SearchSchedule" component={SearchScheduleScreen} options={{ title: '搜尋行程', }} />
            </Stack.Navigator>
        );
    }
}