import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

import { 
    View, 
    Text, 
    Alert, 
    TextInput, 
    StyleSheet, 
    TouchableOpacity, 
} from 'react-native';
import { Icon, } from 'react-native-elements';

export default class UpdateUser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '', 
            password: '',
            newPassword: '',
        }
    }

    updateCredential = () => {
        const user = firebase.auth().currentUser;
        const { email, password, newPassword } = this.state;
        var credential = firebase.auth.EmailAuthProvider.credential(
            email,
            password,
        );
        
        user.reauthenticateWithCredential(credential)
        .then(function() {
            user.updatePassword(newPassword);
            
        })
        .catch(error => this.setState({ errorMessage: error }) );

        this.props.navigation.goBack();
    }

    render() {
        const { navigation } = this.props;
        const back = () => navigation.goBack();

        navigation.setOptions({
            headerLeft: () => (
                <Icon title='Back' name='arrow-back' containerStyle={{ marginLeft:15, }} onPress={() => 
                    Alert.alert(
                        '信息不會被保存！', 
                        '您確定要返回嗎？',
                        [
                            { text: '確定', onPress: () => navigation.goBack() },
                            { text: '取消', style: 'cancel' },
                        ]
                    )
                } />
            ), 
        });

        return(
            <View style={styles.container}>

                <View style={styles.greetContainter}>
                    <Text style={styles.greeting}>{'更改'}</Text>
                    <Text style={styles.greeting}>{'你的密碼'}</Text>
                </View>

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
                            placeholder='舊密碼'
                            secureTextEntry 
                            autoCapitalize="none" 
                            onChangeText={ password => this.setState({password}) } 
                            value={ this.state.password } 
                            blurOnSubmit={ false } 
                            ref={ (input) => { this.pwdInput = input; }} 
                            onSubmitEditing={ () => {this.newPwdInput.focus(); } } 
                        ></TextInput>
                    </View>

                    <View style={ {marginTop:32} }>
                        <TextInput 
                            style={styles.input} 
                            placeholder='新密碼'
                            secureTextEntry 
                            autoCapitalize="none" 
                            onChangeText={ newPassword => this.setState({ newPassword }) } 
                            value={ this.state.newPassword } 
                            blurOnSubmit={ false } 
                            ref={ (input) => { this.newPwdInput = input; }} 
                            onSubmitEditing={ this.updateCredential } 
                        ></TextInput>
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={this.handleLogin}>
                    <Text style={{color: "#FFF", fontWeight: "500"}}> {'保存'} </Text>
                </TouchableOpacity>
            </View>
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
        marginBottom: 36,
        marginHorizontal: 36, 
        justifyContent: 'space-between',
    },
    input: {
        borderBottomColor: "#8A8F9E",
        borderBottomWidth: StyleSheet.hairlineWidth,
        height: 40,
        fontSize: 15,
        color: "#161F30"
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