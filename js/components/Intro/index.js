import React, { Component } from 'react';
import { ActivityIndicator, StyleSheet, AlertIOS, Share } from 'react-native';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import RNfirebase from 'react-native-firebase';

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
    title: 'Welcome to Focus',
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
    title: 'Welcome to Focus',
    text: 'Dating for the modern people.',
    image: require('./assets/banner-welcome.jpg'),
    //image: {uri: 'https://edmullen.net/test/rc.jpg', cache: 'force-cache'},
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

  

  componentWillMount() {

    const userId = firebase.auth().currentUser.uid;
    const route = this.props.navigation.state.routeName;


    //query for logged in users information needed and set state with it.     
    firebase.database().ref('/users/' + userId).once('value', ((userSnap) => {
                
      //set state with user data. 
      this.setState({ 
        userId: userId,
        gender: userSnap.val().gender,
      })
      

      // // let Analytics = RNFirebase.analytics();
      // RNFirebase.analytics().logEvent('swipeEvent', {
      //   like: like.toString()
      // });

    })), 

      RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
      RNfirebase.analytics().setUserId(userId);
      RNfirebase.analytics().setCurrentScreen('Intro', 'Intro');
    
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
          message: 'You gotta check out Focus. It\'s a dating app where only men invited by women can join. You\'ll need this code to enter: '+code,
          url: 'https://helmdating.com/invited.html',
          title: 'Wow, have you seen this yet?'
        }).then(({action, activityType}) => {

          let Analytics = RNfirebase.analytics();
          if(action === Share.dismissedAction) {
            //delete unsent code from db
            firebase.database().ref('codes/' + codeDelete).remove();

            //record in analytics that share was dismissed 
            Analytics.logEvent('shareDialogDismissed', {
              testParam: 'testParamValue1'
            });

            //redirect to settings component
            const { navigate } = this.props.navigation;
            navigate("Settings");

          } 
          else {
            console.log('Share successful');
           
            //record in analytics that share was dismissed 
            Analytics.logEvent('shareDialogSent', {
              testParam: 'testParamValue1'
            });

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
    //save analytics in let
    let Analytics = RNfirebase.analytics();
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
            
            //record in analytics that code was expired 
            Analytics.logEvent('codeExpired', {
              codeData: 'codeData'
            });

            AlertIOS.alert('Whoops!','Code: '+userCode+' has already been used. Please ask your friend for another.');

          }else{
            const { navigate } = this.props.navigation;
   
            //code must exist AND code not expired
            console.log('code exists and is valid!');
            
            //record in analytics that code was expired 
            Analytics.logEvent('codeValid', {
              codeData: 'codeData'
            });

            //update code to expired at the specific code key and redirect to settings
            firebase.database().ref('/codes/'+key).update({expired_date: new Date().getTime(), expired: true});
            
            //alert welcome message, then navigate to settings. 
            AlertIOS.alert(
              'Welcome to Focus!',
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
           //record in analytics that code was expired 
          Analytics.logEvent('codeInvalid', {
            codeData: 'codeData'
          });         
          //AlertIOS.alert('Whoops!','Code: '+userCode+' does not exist. Please ask your friend for another.');

          //let people in for testing
          const { navigate } = this.props.navigation;

          AlertIOS.alert(
              'Welcome to Focus!',
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
      bottomButton={true}
      onDone={this._onDone}/>;
  }
}

export default Intro;
