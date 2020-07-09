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

import RecommendScreen from './RecommendScreen';

export default class RecommendTopTabNav extends React.Component {
    render() {
        const Tab = createMaterialTopTabNavigator();

        return (
            <Tab.Navigator tabBarOptions={{ 
                    labelStyle:{fontSize: 17, fontWeight: 'bold'},
            }}>
                <Tab.Screen name="Auto" component={RecommendScreen} options={{ title: '自動', }} initialParams={{ filter: "Auto" }}/>
                <Tab.Screen name="Manual" component={RecommendScreen} options={{ title: '手動', }} initialParams={{ filter: "Manual" }}/>
            </Tab.Navigator>
        );
    }
    
}
