import React, { Component } from "react";
import Login from "../components/login/";
import Intro from "../components/Intro";
import Messages from "../components/Messages";
import Chat from "../components/Chat";
import Swipes from "../components/Swipes";
import Settings from "../components/Settings";
import { NavigationEvents, createStackNavigator, NavigationActions } from "react-navigation";

//const { navigate } = this.props.navigation;
//console.log('route now is: '+this.state);


export default (StackNav = createStackNavigator({
		  Login: { screen: Login },
		  Swipes: { screen: Swipes},
		  Messages: { screen: Messages},	 
		  Chat: { screen: Chat},
		  Intro: { screen: Intro},	
		  Settings: { screen: Settings},  
		},
		{
			mode: 'card',
			headerMode: 'none'	
		}

	)
);
