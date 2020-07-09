import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import FavoriteScreen from './FavoriteScreen';
import EventDetailScreen from '../events/EventDetailScreen';
import SearchFavScreen from './SearchFavScreen';

export class FavoriteStack extends React.Component {

    render() {
        const Stack = createStackNavigator();

        return (
            <Stack.Navigator screenOptions={{ 
                    headerTitleAlign: 'center',
                    headerTintColor: '#000',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}>
                <Stack.Screen name="Favorite" component={FavoriteScreen} options={{ title: '喜歡的活動', }}/>
                <Stack.Screen name="SearchFav" component={SearchFavScreen} options={{ title: '搜尋喜歡的活動', }}/>
                <Stack.Screen name="EventDetailScreen" component={EventDetailScreen} />
            </Stack.Navigator>
        );
    }
}

  
