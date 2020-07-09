import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { 
    Row, 
    View, 
    Text, 
    Button, 
    Caption, 
    Subtitle, 
    FlatList, 
    StyleSheet, 
    ImageBackground, 
    TouchableOpacity, 
} from 'react-native';
import { TabBar } from 'react-native-tab-view';

import MapScreen from './MapScreen';

export default class MapTopTabNav extends React.Component {
    render() {
        const Tab = createMaterialTopTabNavigator();

        return (
            <Tab.Navigator tabBarOptions={{ 
                labelStyle: {fontSize: 17, fontWeight: 'bold'},
            }}>
                <Tab.Screen name="All" component={MapScreen} options={{ title: '所有', }} initialParams={{ filter: "All" }}/>
                <Tab.Screen name="Eat" component={MapScreen} options={{ title: '飲食', }} initialParams={{ filter: "Eat" }}/>
                <Tab.Screen name="Play" component={MapScreen} options={{ title: '娛樂', }} initialParams={{ filter: "Play"}}/>
                <Tab.Screen name="Buy" component={MapScreen} options={{ title: '購買', }} initialParams={{ filter: "Buy" }}/> 
            </Tab.Navigator>
        );
    }
    
}
