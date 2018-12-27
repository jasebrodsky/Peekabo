import React, { Component } from "react";
import Home from "../components/home/";
import BlankPage2 from "../components/blankPage2";
import Messages from "../components/Messages";
import Swipes from "../components/Swipes";
import Settings from "../components/Settings";
import Chat from "../components/Chat";
import { DrawerNavigator } from "react-navigation";
import DrawBar from "../components/DrawBar";
export default (DrawNav = DrawerNavigator(
  {
    Home: { screen: Home },
    BlankPage2: { screen: BlankPage2 }, 
    Messages: { screen: Messages},
  	Chat: { screen: Chat},
  	Swipes: { screen: Swipes},
  	Settings: { screen: Settings}
  },
  {
    contentComponent: props => <DrawBar {...props} />
  }
));
