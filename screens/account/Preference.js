import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import { 
    View, 
    Text, 
    Image, 
    TextInput, 
    ScrollView, 
    StyleSheet, 
    Dimensions, 
    TouchableOpacity, 
    ActivityIndicator, 
} from 'react-native';
import { CheckBox, ListItem, Icon } from 'react-native-elements'; 

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class Preference extends React.Component {
    constructor(props){
        super(props);
        
        this.state = {
            preference: [], 
            choice: {}, 
            isLoading: true, 
        }
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        var choice = {};
        this.setState({ isLoading: true, });

        await firebase
            .firestore()
            .collection('Preference')
            .doc('Fop9gwRmgQPf6q3AQlgC')
            .get()
            .then(doc => {
                var data = doc.data();
                this.setState({ preference: data.preference });
            });

        await firebase
            .firestore()
            .collection('Users')
            .doc(firebase.auth().currentUser.uid)
            .get()
            .then(doc => {
                var data = doc.data();
                this.setState({ choice: data.preference, isLoading: false });
            });
    }

    handlePress = (item, type) => {
        var choice = this.state.choice;

        if ( choice && choice[type] && choice[type].includes(item) ) {
            choice[type] = choice[type].filter(a => a !== item);
            this.setState({ choice });
        } else if ( choice && choice[type] && !choice[type].includes(item) ) {
            choice[type] = [ ...choice[type], item ];
            this.setState({ choice });
        } else {
            choice = { [type]:[item], };
            this.setState({ choice });
        }
    };

    handleData = () => {
        const user = firebase.auth().currentUser;
        const preference = this.state.choice;

        firebase
            .firestore()
            .collection('Users')
            .doc(user.uid)
            .set({
                preference: preference, 
            }, { merge: true })
            .catch(error => this.setState( {errorMessage: error.message} ));
        
        this.props.navigation.goBack();
    }

    render() {
        const { preference } = this.state;

        return(
            <ScrollView style={styles.container}>
                <View style={styles.greetContainter}>
                    <Text style={styles.greeting}>{'個人化'}</Text>
                    <Text style={styles.greeting}>{'你的體驗'}</Text>
                </View>

                {
                    preference && preference.length ?
                        preference.map((ptype, key) => {
                            return(
                                <View key={key}>
                                    <Text style={styles.title}> {ptype.title} </Text>
                                    {
                                        ptype.choice.map((item, index) => (
                                            <ListItem 
                                                key={index} 
                                                title={item.text} 
                                                containerStyle={styles.listItem} 
                                                titleStyle={styles.infoTitle} 
                                                bottomDivider
                                                checkBox={{
                                                    iconType: 'material', 
                                                    checkedIcon: 'clear', 
                                                    uncheckedIcon: 'add', 
                                                    uncheckedColor:'#0f0', 
                                                    checkedColor: '#f00', 
                                                    onPress: () => this.handlePress(item.value, ptype.type), 
                                                    checked: this.state.choice && this.state.choice[ptype.type] ? this.state.choice[ptype.type].includes(item.value) : false, 
                                                }}
                                            />
                                        ))
                                    }
                                </View>
                            );
                        })
                    :
                    <ActivityIndicator />
                }

                <TouchableOpacity style={[ styles.button, { marginVertical: 32, }]} onPress={this.handleData}>
                    <Text style={{color: '#FFF', fontWeight: '500'}}> {'保存'} </Text>
                </TouchableOpacity>

            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    greetContainter: {
        marginTop: 36, 
        justifyContent: 'center',
    }, 
    greeting:{
        letterSpacing: 5, 
        lineHeight: 30,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center', 
        alignSelf: 'center', 
    }, 
    errorMessage: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    }, 
    error: {
        color: '#E9446A',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center', 
    }, 
    title: { 
        textTransform: 'capitalize', 
        fontWeight: 'bold', 
        alignSelf: 'center', 
        fontSize: 20, 
        marginVertical: 15, 
    },     
    listItem: { 
        height: 45, 
    }, 
    infoTitle: {
        textTransform: 'capitalize',
        marginLeft: 15, 
    }, 
    form: {
        width: 'auto',
        marginVertical: 36,
        marginHorizontal: 36, 
        justifyContent: 'space-between',
    }, 
    dropdownPicker: {
        alignSelf: 'center', 
        height: 50, 
        width: width * 0.7, 
    }, 
    button: {
        height: 52, 
        width: 350, 
        borderRadius: 4, 
        alignSelf: 'center', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#FFC30B', 
    }, 
});