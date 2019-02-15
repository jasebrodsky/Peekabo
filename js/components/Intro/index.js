import React, { Component } from 'react';
import { connect } from "react-redux";
import { ActivityIndicator, StyleSheet } from 'react-native';
import DrawBar from "../DrawBar";
//import Icon from 'react-native-ionicons'
//import { LinearGradient } from 'expo';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import AppIntroSlider from 'react-native-app-intro-slider';
import * as firebase from "firebase";
import { DrawerNavigator, NavigationActions } from "react-navigation";
import {
  Container,
  Icon,
  Text,
  Button,
  List,
  ListItem,
  Body,
  View
} from "native-base";
import { setIndex } from "../../actions/list";
import { openDrawer } from "../../actions/drawer";


const styles = StyleSheet.create({
  buttonCircle: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 320,
    height: 320,
  }
});

const slides = [
  {
    key: 'somethun',
    title: 'Quick setup, good defaults',
    text: 'React-native-app-intro-slider is easy to setup with a small footprint and no dependencies. And it comes with good default layouts!',
    icon: 'ios-images-outline',
    colors: ['#63E2FF', '#B066FE'],
  },
  {
    key: 'somethun1',
    title: 'Super customizable',
    text: 'The component is also super customizable, so you can adapt it to cover your needs and wants.',
    icon: 'ios-options-outline',
    colors: ['#A3A1FF', '#3A3897'],
  },
  {
    key: 'somethun2',
    title: 'No need to buy me beer',
    text: 'Usage is all free',
    icon: 'ios-beer-outline',
    colors: ['#29ABE2', '#4F00BC'],
  },
];





class Intro extends Component {

  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      loading: true
    }

  }
  static navigationOptions = ({ navigation }) => {
    return {
      title: null,
    }
  };
  static propTypes = {
    name: React.PropTypes.string,
    setIndex: React.PropTypes.func,
    list: React.PropTypes.arrayOf(React.PropTypes.string),
    openDrawer: React.PropTypes.func
  };
  

  componentWillMount() {
    const { state, navigate } = this.props.navigation;
     //userId = firebase.auth().currentUser.uid;
     //firebaseRef = firebase.database().ref('/matches/'+userId+'/').orderByChild('last_message_date').limitToFirst(50);
  }
  

  _renderNextButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <Icon
          name="md-arrow-round-forward"
          color="rgba(255, 255, 255, .9)"
          size={24}
          style={{ backgroundColor: 'transparent' }}
        />
      </View>
    );
  }
  _renderDoneButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <Icon
          name="md-checkmark"
          color="rgba(255, 255, 255, .9)"
          size={24}
          style={{ backgroundColor: 'transparent' }}
        />
      </View>
    );
  }



  render() {
    return (
      <AppIntroSlider
        slides={slides}
        renderDoneButton={this._renderDoneButton}
        renderNextButton={this._renderNextButton}/>
      );
  }
}

function bindAction(dispatch) {
  return {
    setIndex: index => dispatch(setIndex(index)),
    openDrawer: () => dispatch(openDrawer())
  };
}
const mapStateToProps = state => ({
  name: state.user.name,
  list: state.list.list
});

const IntroSwagger = connect(mapStateToProps, bindAction)(Intro);
const DrawNav = DrawerNavigator(
  {
    Home: { screen: IntroSwagger }
  },
  {
    contentComponent: props => <DrawBar {...props} />
  }
);
const DrawerNav = null;
DrawNav.navigationOptions = ({ navigation }) => {
  DrawerNav = navigation;
  return {
    header: null
  };
};
export default DrawNav;
