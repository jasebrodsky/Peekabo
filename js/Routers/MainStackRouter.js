import React, { Component } from "react";
import Login from "../components/login/";
import Intro from "../components/Intro";
import Home from "../components/home/";
import BlankPage from "../components/blankPage";
import BlankPage2 from "../components/blankPage2";
import Messages from "../components/Messages";
import Chat from "../components/Chat";
import Swipes from "../components/Swipes";
import Settings from "../components/Settings";
import HomeDrawerRouter from "./HomeDrawerRouter";
import { StackNavigator, NavigationActions } from "react-navigation";
import { Header, Left, Button, Icon, Body, Title, Right } from "native-base";
HomeDrawerRouter.navigationOptions = ({ navigation }) => ({
  header: null
});
export default (StackNav = StackNavigator({
	  Login: { screen: Login },
	  Swipes: { screen: Swipes},
	  Messages: { screen: Messages},
	  Intro: { screen: Intro},
	  Chat: { screen: Chat},
	  Settings: { screen: Settings},
	  Home: { screen: Home },
	  BlankPage: { screen: BlankPage }
	},
	{
		mode: 'card'	
	}
));
