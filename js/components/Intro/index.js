import React, { Component } from 'react';
import { connect } from "react-redux";
import { ActivityIndicator, StyleSheet, AlertIOS, Share } from 'react-native';
import DrawBar from "../DrawBar";
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
  },
  text: {
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    color: 'white',
    backgroundColor: 'transparent',
    textAlign: 'center',
    marginBottom: 16,
  }
});

//create slides female and male
const slidesFemale = [
  {
    key: '1',
    title: 'Welcome to Helm',
    text: 'Dating for the modern people.',
    image: require('./assets/banner-welcome.jpg'),
    imageStyle: styles.image,
    backgroundColor: '#22bcb5',
  },
  {
    key: '2',
    title: 'Better conversations',
    text: 'With each message photos will unblur.',
    image: require('./assets/banner-chat.jpg'),
    imageStyle: styles.image,
    backgroundColor: '#22bcb5',
  },
  {
    key: '3',
    title: 'Only gentlemen',
    text: 'Men need to be invited by a female.',
    image: require('./assets/banner-gentlemen.jpg'),
    imageStyle: styles.image,
    backgroundColor: '#22bcb5',
  }
];

const slidesMale = [
  {
    key: '1',
    title: 'Welcome to Helm',
    text: 'Dating for the modern people.',
    //image: require('./assets/banner-welcome.jpg'),
    image: {uri: 'https://edmullen.net/test/rc.jpg', cache: 'force-cache'},
    imageStyle: styles.image,
    backgroundColor: '#22bcb5',
  },
  {
    key: '2',
    title: 'Better conversations',
    text: 'With each message photos will unblur.',
    image: require('./assets/banner-chat.jpg'),
    imageStyle: styles.image,
    backgroundColor: '#22bcb5',
  },
  {
    key: '3',
    title: 'Enter your code',
    text: 'Men need to be invited by a female.',
    image: require('./assets/banner-gentlemen.jpg'),
    imageStyle: styles.image,
    backgroundColor: '#22bcb5',
  }
];

class Intro extends Component {

  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      loading: true,
      gender: 'Male',
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

    const userId = firebase.auth().currentUser.uid;

    //query for logged in users information needed and set state with it.     
    firebase.database().ref('/users/' + userId).once('value', ((userSnap) => {
                
      //set state with user data. 
      this.setState({ 
        userId: userId,
        gender: userSnap.val().gender,
      });
    }))
  }


  //Share function when sharing referral code native share functionality. 
  _onShare = () => {

    //fetch from getCode cloud function
    fetch('https://us-central1-blurred-195721.cloudfunctions.net/getCode?userid='+this.state.userId)
    .then((response) => response.json())
    .then((responseJson) => {
               
        //save code var.
        let code = responseJson.sharable_code;
        let codeDelete = responseJson.code_id;

        //prompt native share functionality 
        Share.share({
          message: 'You gotta check out Helm. It\'s a dating app where only men invited by women can join. You\'ll need this code to enter: '+code,
          url: 'https://helmdating.com/invited.html',
          title: 'Wow, have you seen this yet?'
        }).then(({action, activityType}) => {
          if(action === Share.dismissedAction) {
            //delete unsent code from db
            firebase.database().ref('codes/' + codeDelete).remove();

            //redirect to settings component
            const { navigate } = this.props.navigation;
            navigate("Settings");

          } 
          else {
            console.log('Share successful');
            //redirect to settings component
            const { navigate } = this.props.navigation;
            navigate("Settings");

          }
        })
    })
    .catch(function(error) {
        alert("Data could not be saved." + error);
    });
  };

  
  //check code is valid
  _checkCode = (userCode) => {

    //call firebase if code exists and is not expired
    firebase.database().ref("/codes").orderByChild("sharable_code").equalTo(userCode).once("value",codeSnap => {
        //check if code exists
        if (codeSnap.exists()){

          //get save code to obj
          let code = codeSnap.val();
          let key = Object.keys(code);
          let codeData = code[key];
          let expired = codeData.expired;
                
          //check if code is also expired
          if(expired == true){

            //handle that code is expired. 
            console.log('sorry code is expired already. Ask your friend for another.');
            AlertIOS.alert('Whoops!','Code: '+userCode+' has already been used. Please ask your friend for another.');
          }else{
            const { navigate } = this.props.navigation;
   
            //code must exist AND code not expired
            console.log('code exists and is valid!');
            //update code to expired at the specific code key and redirect to settings
            firebase.database().ref('/codes/'+key).update({expired_date: new Date().getTime(), expired: true});
            
            //alert welcome message, then navigate to settings. 
            AlertIOS.alert(
              'Welcome to Helm!',
              'Click ok to enter community.',
              [
                {
                  text: 'Ok',
                  onPress: () => navigate("Settings"),
                },
              ],
            );
            

          }
        //code doesnt exist
        }else{

          //handle that code doesnt exist. 
          console.log('sorry code doesnt exist. ask your friend for another');
          
          //AlertIOS.alert('Whoops!','Code: '+userCode+' does not exist. Please ask your friend for another.');

          //let people in for testing
          const { navigate } = this.props.navigation;

          AlertIOS.alert(
              'Welcome to Helm!',
              'actually check code before launching.',
              [
                {
                  text: 'Ok',
                  onPress: () => navigate("Swipes"),
                },
              ],
            );



        }
    });
  }

  _onDone = () => {
    const { navigate } = this.props.navigation;
    //navigate("Settings");

    //if gender is male then render redeem code flow. 
    if (this.state.gender == 'male'){

      AlertIOS.prompt(
        'Enter code',
        'Enter your referral code you received from a friend',
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: 'Submit',
            onPress: (code) => this._checkCode(code),
          },
        ],
        'plain-text',
      );

    }else{
      //user must be female, render invite friend flow
      this._onShare();
    }
  }

  render() {
    const { navigate } = this.props.navigation;
    const slides = (this.state.gender == 'male') ? slidesMale : slidesFemale;      
    const doneLabel = (this.state.gender == 'male') ? 'Enter code' : 'Invite and continue';      

    return <AppIntroSlider 
      slides={slides} 
      doneLabel={doneLabel}
      bottomButton = {true}
      onDone={this._onDone}/>;
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
