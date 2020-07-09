import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { TabBar } from 'react-native-tab-view';
import EventScreen from './EventScreen';

export default class eventTopTabNav2 extends React.Component {

    render() {
        const { filter } = this.props.route.params;
        const Tab = createMaterialTopTabNavigator();

        return (
            <Tab.Navigator 
                tabBarOptions={{
                    labelStyle:{fontSize: 17, fontWeight: 'bold'},
                }}>
                <Tab.Screen name="OnHeat" component={EventScreen} options={{ title: '熱門', }} initialParams={{ sort: "hot", filter: filter }}/>
                <Tab.Screen name="Suggest" component={EventScreen} options={{ title: '推薦', }} initialParams={{ sort: "recommend", filter: filter }}/>
            </Tab.Navigator>
        );
    }
    
}
