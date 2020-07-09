import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

import Loading from '../Loading';
import Login from './Login';
import Register from './Register';
import Account from './Account';
import EditInfo from './EditInfo';
import FriendList from './FriendList';
import AddFriend from './AddFriend';
import UserInfo from './UserInfo';
import GroupList from './GroupList';
import AddMember from './AddMember';
import GroupInfo from './GroupInfo';
import Preference from './Preference';
import UpdateUser from './UpdateUser';
import MyAgenda from './MyAgenda';
import AddEvent from './AddEvent';
import ScheduleDetailScreen from '../schedule/ScheduleDetailScreen';
import ScheduleMapScreen from '../schedule/ScheduleMapScreen';

export class AccountStack extends React.Component {

    state = {
        loggedIn: false
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
            this.state.loggedIn ? (
                <>
                    <Stack.Navigator
                        initialRouteName='Loading'
                        screenOptions={{
                            headerTitleAlign: 'center', 
                            headerStyle: {
                                //backgroundColor: '#FFAA1D',
                            },
                            headerTintColor: '#000',
                            headerTitleStyle: {
                                fontWeight: 'bold',
                            },
                        }}
                    > 
                        <Stack.Screen name="Loading" component={Loading} options={{title: '載入中', }} initialParams={{ route: 'Account' }} />
                        <Stack.Screen name="Account" component={Account} options={{ title: '我的帳號', }}/>
                        <Stack.Screen name="EditInfo" component={EditInfo} options={{ title: '編輯資訊', }}/>
                        <Stack.Screen name="FriendList" component={FriendList} options={{ title: '好友', }}/>
                        <Stack.Screen name="AddFriend" component={AddFriend} options={{ title: '添加好友', }}/>
                        <Stack.Screen name="GroupList" component={GroupList} options={{ title: '群組', }}/>
                        <Stack.Screen name="AddMember" component={AddMember} options={{ title: '添加成員', }}/>
                        <Stack.Screen name="GroupInfo" component={GroupInfo} options={{ title: '群組資訊', }}/>
                        <Stack.Screen name="UserInfo" component={UserInfo} options={{ title: '用戶資訊', }}/>
                        <Stack.Screen name="Preference" component={Preference} options={{ title: '偏好設置', }}/>
                        <Stack.Screen name="MyAgenda" component={MyAgenda} options={{ title: '日程', }}/>
                        <Stack.Screen name="AddEvent" component={AddEvent} options={{ title: '', }}/>
                        <Stack.Screen name="UpdateUser" component={UpdateUser} options={{ title: '更改密碼', }}/>
                        <Stack.Screen name="ScheduleDetailScreen" component={ScheduleDetailScreen} />
                        <Stack.Screen name="ScheduleMapScreen" component={ScheduleMapScreen} />
                    </Stack.Navigator>
                </>
            ) : (
                <>
                    <Stack.Navigator
                        initialRouteName='Loading'
                        screenOptions={{
                            headerTitleAlign: 'center', 
                            headerStyle: {
                                //backgroundColor: '#FFAA1D',
                            },
                            headerTintColor: '#000',
                            headerTitleStyle: {
                                fontWeight: 'bold',
                            },
                        }}
                    > 
                        <Stack.Screen name="Loading" component={Loading} options={{ title: 'Loading', }} initialParams={{ route: 'Login' }}/>
                        <Stack.Screen name="Login" component={Login} options={{ title: '登入', }} />
                        <Stack.Screen name="Register" component={Register} options={{ title: '註冊', }}/>
                        <Stack.Screen name="ScheduleDetailScreen" component={ScheduleDetailScreen} />
                    </Stack.Navigator>
                </>
            )
        );
    }
}