import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import eventTopTabNav from './eventTopTabNav';
import EventDetailScreen from './EventDetailScreen';
import EventMapScreen from './EventMapScreen';
import SearchEventsScreen from './SearchEventsScreen';
import MapTopTabNav from './MapTopTabNav';

export class EventStack extends React.Component {

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
                <Stack.Screen name="Event" component={eventTopTabNav} options={{ title: '活動', }} />
                <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} options={{ title: 'Event list', }} />
                <Stack.Screen name="SearchEvents" component={SearchEventsScreen} option={{ title: '搜尋活動', }} />
                <Stack.Screen name="MapTopTabNav" component={MapTopTabNav} options={{ title: '地圖', }} />
                <Stack.Screen name="EventMapScreen" component={EventMapScreen} />
            </Stack.Navigator>
        );
    }
}

  
