import React, { Component } from 'react';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import { 
    View, 
    Text, 
    Image, 
    Alert,
    TextInput, 
    ScrollView, 
    StyleSheet, 
    Dimensions, 
    TouchableOpacity, 
} from 'react-native';
import { Icon } from 'react-native-elements';

var width = Dimensions.get('window').width; //full width
var height = Dimensions.get('window').height; //full height

export default class EditInfo extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            firstName: '', 
            lastName: '', 
            phoneNo: '', 
            title: '', 
            displayName: '', 
            gender: '', 
            errorMessage: null, 
        }
    
    }

    componentDidMount() {
        this.initialData();
    }

    async initialData() {
        const docRef = firebase
            .firestore()
            .collection('Users')
            .doc(firebase.auth().currentUser.uid);
    
        var data = (await docRef.get()).data();
        const { displayName, title, firstName, lastName, gender, phoneNo } = data;
    
        this.setState({ displayName, title, firstName, lastName, gender, phoneNo });
    }

    handleEdit = () => {
        const user = firebase.auth().currentUser;
        const db = firebase.firestore();
        this.setState({ errorMessage: null });

        const { title, firstName, lastName, gender, phoneNo, displayName, } = this.state;

        const data = {
            title: title,
            firstName: firstName, 
            lastName: lastName, 
            displayName: displayName, 
            gender: gender, 
            phoneNo: phoneNo, 
        };

        if (title !== '' && gender !== '' && (phoneNo.length == 8 || phoneNo === '')) {
            if(!this.state.errorMessage) {
                db.collection('Users')
                    .doc(user.uid)
                    .set(data, { merge: true })
                    .catch(error => this.setState( {errorMessage: error.message} ));
            }

            this.props.navigation.reset({
                routes: [{ name: 'Loading' }],
            });

        } else {
            this.setState({ errorMessage: '輸入的值無效' });
        }
    }

    render(){
        const { navigation } = this.props;
        const back = () => navigation.goBack();

        navigation.setOptions({
            headerLeft: () => (
                <Icon title='Back' containerStyle={{ marginLeft: 15, }} name='arrow-back'  onPress={() => 
                    Alert.alert(
                        '信息不會被保存！', 
                        '您確定要返回嗎？',
                        [
                            { text: '確定', onPress: () => navigation.goBack() },
                            { text: '確定', style: 'cancel' },
                        ]
                    )
                } />
            ), 
        });
        
        return(
            <View style={styles.container}>
                <View style={styles.greetContainter}>
                    <Text style={styles.greeting}>{'修改'}</Text>
                    <Text style={styles.greeting}>{'您的信息'}</Text>
                </View>

                <View style={styles.errorMessage}>
                    {this.state.errorMessage && <Text style={styles.error}>{this.state.errorMessage}</Text>}
                </View>

                <View style={styles.form}>
                    <View style={styles.inputRow}>
                        <TextInput 
                            style={styles.input} 
                            placeholder='稱謂' 
                            onChangeText={title => this.setState({ title })} 
                            value={this.state.title} 
                            blurOnSubmit={ false } 
                            ref={ (input) => { this.titleInput = input; }} 
                            onSubmitEditing={ () => { this.firstInput.focus(); } } 
                        />

                        <TextInput 
                            style={[styles.input, { marginLeft: 12, width: width * 0.275, }]}  
                            placeholder='名字' 
                            onChangeText={firstName => this.setState({ firstName })} 
                            value={this.state.firstName} 
                            blurOnSubmit={ false } 
                            ref={ (input) => { this.firstInput = input; }} 
                            onSubmitEditing={ () => { this.lastInput.focus(); } } 
                        />

                        <TextInput 
                            style={[styles.input, { marginLeft: 12, width: width * 0.275, }]} 
                            placeholder='姓氏' 
                            onChangeText={lastName => this.setState({ lastName })} 
                            value={this.state.lastName} 
                            blurOnSubmit={ false } 
                            ref={ (input) => { this.lastInput = input; }} 
                            onSubmitEditing={ () => { this.phoneInput.focus(); } } 
                        />

                    </View>

                    <View style={[styles.inputRow, { marginTop:32, } ]}>

                        <TextInput 
                            style={styles.input} 
                            placeholder='性別' 
                            onChangeText={gender => this.setState({ gender })} 
                            value={this.state.gender} 
                            blurOnSubmit={ false } 
                            ref={ (input) => { this.genderInput = input; }} 
                            onSubmitEditing={ () => { this.phoneInput.focus(); } } 
                            maxLength={1}
                        />

                        <TextInput 
                            style={[styles.input, { marginLeft: 12, width: width * 0.6, }]} 
                            placeholder='電話號碼' 
                            onChangeText={phoneNo => this.setState({ phoneNo })} 
                            value={this.state.phoneNo} 
                            blurOnSubmit={ false } 
                            ref={ (input) => { this.phoneInput = input; }} 
                            onSubmitEditing={ () => { this.displayInput.focus(); } } 
                            keyboardType={ 'numeric' }
                            maxLength={8}
                        />

                    </View>

                    <View style={{marginTop:32}}>
                        <TextInput 
                            style={styles.input} 
                            placeholder='顯示名稱' 
                            onChangeText={displayName => this.setState({ displayName })} 
                            value={this.state.displayName} 
                            blurOnSubmit={ false } 
                            ref={ (input) => { this.displayInput = input; }} 
                            onSubmitEditing={ () => { this.handleEdit } } 
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={this.handleEdit}>
                    <Text style={{color: '#FFF', fontWeight: '500'}}> { '保存' } </Text>
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
    form: {
        width: 'auto',
        marginBottom: 36,
        marginHorizontal: 36, 
        justifyContent: 'space-between',
    }, 
    inputRow: {
        width: 'auto', 
        flexDirection:'row', 
        alignItems: 'center',
        justifyContent: 'space-between',
    }, 
    input: {
        borderBottomColor: '#8A8F9E',
        borderBottomWidth: StyleSheet.hairlineWidth,
        height: 40, 
        fontSize: 15,
        color: '#161F30', 
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