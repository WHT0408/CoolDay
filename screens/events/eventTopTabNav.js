import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { Icon, } from 'react-native-elements';
import { TabBar } from 'react-native-tab-view';

import EventScreen from './EventScreen';
import EventTopTabNav2 from './EventTopTavNav2';


export default class eventTopTabNav extends React.Component {

    render() {
        const { navigation } = this.props;
        const Tab = createMaterialTopTabNavigator();

        navigation.setOptions({
            headerRight: () => (
                <Icon name='search' size={30} containerStyle={{ marginHorizontal: 15 }} onPress={() => navigation.navigate('SearchEvents') } />
            ), 
            headerLeft: () => (
                <Icon name='map' size={30} color={'black'} containerStyle={{ marginHorizontal: 15 }} onPress={() => navigation.navigate('MapTopTabNav') } />
            ), 
        });

        return (
            <Tab.Navigator tabBarOptions={
                {   labelStyle:{fontSize: 17, fontWeight: 'bold'},
                }}>
                <Tab.Screen name="所有" component={EventTopTabNav2} initialParams={{ filter: "All" }}/>
                <Tab.Screen name="飲食" component={EventTopTabNav2} initialParams={{ filter: "Eat" }}/>
                <Tab.Screen name="娛樂" component={EventTopTabNav2} initialParams={{ filter: "Play"}}/>
                <Tab.Screen name="購買" component={EventTopTabNav2} initialParams={{ filter: "Buy" }}/> 
            </Tab.Navigator>
        );
    }
    
}
