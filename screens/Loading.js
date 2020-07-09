import React, { Component } from 'react';

import {
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
} from 'react-native';

export default class Loading extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            route: "",
        }
    }

    componentDidMount() {
        const route = this.props.route.params.route;
        this.props.navigation.replace(route);
    }

    render() {
        return (
            <View style={styles.container}>
                <ActivityIndicator size={"large"} />
                <Text style={styles.loading} > { '載入中' } </Text>
                <Text style={styles.loading} >{this.state.route}</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center', 
        justifyContent: 'center', 
    }, 
    laoding: {
        textDecorationStyle: "solid",
        textTransform: "uppercase",
    }, 
    errorMessage: {
        height: 72,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 30
    }, 
});