import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import UserInfo from '../account/UserInfo';
import RecommendScreen from './RecommendScreen';
import RecommendTopTabNav from './RecommendTopTabNav';
import EventMapScreen from '../events/EventMapScreen';
import RecommendResultScreen from './recommendResultScreen';
import EventDetailScreen from '../events/EventDetailScreen';

export class RecommendStack extends React.Component {

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
                <Stack.Screen name="Recommend" component={RecommendTopTabNav} options={{ title: '計劃',  }} />
                <Stack.Screen name="UserInfo" component={UserInfo} />
                <Stack.Screen name="RecommendResultScreen" component={RecommendResultScreen} />
                <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
                <Stack.Screen name="EventMapScreen" component={EventMapScreen} />
            </Stack.Navigator>
        );
    }
}

  
