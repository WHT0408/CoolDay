import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';


import MapScreen from './MapScreen';
import MapTopTabNav from './MapTopTabNav';
import EventDetailScreen from '../events/EventDetailScreen'

export class MapStack extends React.Component {

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
                <Stack.Screen name="MapTopTabNav" component={MapTopTabNav} options={{ title: '地圖', }} />
                <Stack.Screen name="MapScreen" component={MapScreen} />
                <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
            </Stack.Navigator>
        );
    }
}

  
