import React, { PureComponent } from 'react';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

import { 
    View, 
    Text, 
    Button, 
    StyleSheet, 
    ActivityIndicator, 
} from 'react-native';

export class TestScreen extends PureComponent {

    state = {
        uploading: false, 
        fullName: "", 
        errorMessage: "", 
    }

    async componentDidMount() {
        var docRef = firebase
            .firestore()
            .collection("Users")
            .doc("TDSXgS0xUkQHBRGnub80Tzi8XPn2")

        const data = (await docRef.get()).data();
        
        if (data) {
            this.setState({ fullName: data.firstName + ' ' + data.lastName });
        }
    }

    UpdateURL = () => {

        const data = {
            firstName: 'Tony',
            lastName: 'Wong',
            gender: 'M',
            hobby: 'badminton',
            favourite: 'japanese_food',
        }

        var docRef = firebase
            .firestore()
            .collection("Users")
            .doc("TDSXgS0xUkQHBRGnub80Tzi8XPn2")

        let addDoc = docRef.set(data);
    }

    render() {
        return (
            this.state.uploading ? (
                <ActivityIndicator size='large' />       
            ) : (
                <View style={Styles.container}>
                    <Text style={ Styles.title}> {this.state.fullName} </Text>
                    <Text style={ Styles.errorMessage}> {this.state.errorMessage} </Text>
                    <Button title="Upload" style={ Styles.button } onPress={ this.UpdateURL } />
                </View>
            )
        );
    }
}

const Styles = StyleSheet.create({
    container:{
        flex: 1,
        alignItems: 'center', 
        justifyContent: 'center', 
    }, 
    errorMessage: {
        height: 72,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 30
    }, 
    button: {
        tintColor: 'yellow', 
        width: 500,
        height: 150, 
        marginHorizontal: 30, 
    }, 
    title: {
        fontSize: 40, 
    }, 
});