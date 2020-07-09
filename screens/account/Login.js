import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

import { 
    View, 
    Text, 
    Image, 
    TextInput, 
    StyleSheet, 
    Dimensions, 
    TouchableOpacity, 
} from 'react-native';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height
var ratio = width * 0.7 / 1200;

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            email: "",
            password: "",
            errorMessage: null, 
        }
    }

    handleLogin = () => {
        firebase.auth().languageCode = 'hk';
        const { email, password } = this.state;
        const errorMessage = '';

        if (email !== '' && password !== '') {
            firebase
                .auth()
                .signInWithEmailAndPassword(email, password)
                .catch(error => {
                    this.setState({ errorMessage: error.message });
                    console.log(error);
                });
        } else {
            this.setState({ errorMessage: 'Email or password cannot be empty'});
        }

    }

    render(){
        const photo = require('../../image/slogan.png');
        

        return(
            <View style={styles.container}>
                <Image style={styles.image} resizeMethod='auto' source={ photo } />

                <View style={styles.errorMessage}>
                    {this.state.errorMessage && <Text style={styles.error}>{this.state.errorMessage}</Text>}
                </View>

                <View style={styles.form}>
                    <View>
                        <TextInput 
                            style={styles.input} 
                            placeholder='電子郵件'
                            autoCapitalize="none"
                            onChangeText={ email => this.setState({email}) } 
                            value={ this.state.email  } 
                            blurOnSubmit={ false } 
                            onSubmitEditing={ () => { this.state.password != "" ? this.handleLogin : this.pwdInput.focus(); } }
                        ></TextInput>
                    </View>

                    <View style={ {marginTop:32} }>
                        <TextInput 
                            style={styles.input} 
                            placeholder='密碼'
                            secureTextEntry 
                            autoCapitalize="none" 
                            onChangeText={ password => this.setState({password}) } 
                            value={ this.state.password } 
                            blurOnSubmit={ false } 
                            ref={ (input) => { this.pwdInput = input; }} 
                            onSubmitEditing={this.handleLogin} 
                        ></TextInput>
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={this.handleLogin}>
                    <Text style={{color: "#FFF", fontWeight: "500"}}>{ '登入' }</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{alignSelf: "center", marginTop: 32}}>
                    <Text style={{color: "#414959", fontSize: 13}}>
                        {'還沒註冊 CoolDay? '} <Text style={{ fontWeight: "500", color: "#1E90FF" }} onPress={() => this.props.navigation.navigate("Register")} > {'立即注冊吧'} </Text>
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1, 
    },
    errorMessage: {
        height: 72,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 30
    },
    error: {
        color: "#E9446A",
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center" 
    },
    form: {
        width: 'auto',
        marginBottom: 32,
        marginHorizontal: 32, 
        justifyContent: 'space-between',
    },
    input: {
        borderBottomColor: "#8A8F9E",
        borderBottomWidth: StyleSheet.hairlineWidth,
        height: 45,
        fontSize: 15,
        color: "#161F30"
    }, 
    image: {
        width: width * 0.7, 
        height: 300 * ratio,
        alignSelf: 'center', 
        marginTop: width * 0.2, 
        marginBottom: 32, 
    }, 
    button: {
        marginHorizontal: 30,
        backgroundColor: "#FFC30B",
        borderRadius: 4,
        height: 52,
        alignItems: "center",
        justifyContent: "center"
    }
});