/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */
import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

import SplashScreen from 'react-native-splash-screen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { 
  StyleSheet, 
} from 'react-native';

import { 
  EventStack,
  ScheduleStack,
  MapStack,
  AccountStack, 
  TestScreen, 
  RecommendStack,
  FavoriteStack,
} from './screens';

console.disableYellowBox = true;

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loggedIn: false
    }
  }
  componentDidMount() {
    SplashScreen.hide();
    firebase.auth().onUserChanged((user) => {
      if(user){
          this.setState({ loggedIn: true})
      } else {
          this.setState({ loggedIn: false})
      }
    })
  }

  render() { 
    const Tab = createBottomTabNavigator();
    const recommendScreen = <Tab.Screen name='RecommendStack' component={RecommendStack} options={{ tabBarLabel: '', }} />;
    const accountScreen = <Tab.Screen name='RecommendLogin' component={AccountStack}  options={{ tabBarLabel: '', }} />;

    return (
      <NavigationContainer>
        <Tab.Navigator screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'EventStack') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'ScheduleStack') {
              iconName = focused ? 'calendar-month' : 'calendar-month-outline';
            } else if (route.name === 'RecommendStack' || route.name === 'RecommendLogin') {
              iconName = focused ? 'plus-circle' : 'plus-circle-outline';
              size = 45;
            } else if (route.name === 'MapStack') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'FavoriteStack') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'AccountStack') {
              iconName = focused ? 'account' : 'account-outline';
            } else {
              iconName = focused ? 'help-circle' : 'help-circle-outline';
            }

            if (route.name === 'RecommendStack' || route.name === 'RecommendLogin') 
              return <Icon name={iconName} style={styles.recommend} size={size} color={color} />;
            else
              return <Icon name={iconName} size={size} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: '#FFC30B',
          inactiveTintColor: 'black',
        }}
      >
          <Tab.Screen name='EventStack' component={EventStack} options={{ tabBarLabel: '活動', }} />
          <Tab.Screen name='ScheduleStack' component={ScheduleStack} options={{ tabBarLabel: '行程', }} />
          { this.state.loggedIn ? recommendScreen : accountScreen }
          {/* <Tab.Screen name='RecommendStack' component={RecommendStack} options={{tabBarLabel: '計劃',}} /> */}
          {/* <Tab.Screen name='MapStack' component={MapStack} options={{tabBarLabel: '地圖',}} /> */}
          <Tab.Screen name='FavoriteStack' component={FavoriteStack} options={{ tabBarLabel: '喜歡', }} />
          <Tab.Screen name='AccountStack' component={AccountStack} options={{ tabBarLabel: '帳號', }} />
          {/* <Tab.Screen name='Test' component={TestScreen} /> */}
        </Tab.Navigator>
      </NavigationContainer>
    );
  }
}


const styles = StyleSheet.create({
  recommend: {
    top: 8,
  },
});
