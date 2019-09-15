import React, { Component } from "react";
import { ImageBackground, Image } from "react-native";
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import Geocoder from 'react-native-geocoding';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import {
  Container,
  Content,
  Item,
  Input,
  Button,
  Icon,
  View,
  Text
} from "native-base";

import styles from "./styles";
import { AccessToken, LoginManager, GraphRequest, GraphRequestManager } from 'react-native-fbsdk';

const background = require("../../../images/background_helm.jpg");
const logo = require("../../../images/logo_helm.png");


// const validate = values => {
//   const error = {};
//   error.email = "";
//   error.password = "";
//   var ema = values.email;
//   var pw = values.password;
//   if (values.email === undefined) {
//     ema = "";
//   }
//   if (values.password === undefined) {
//     pw = "";
//   }
//   if (ema.length < 8 && ema !== "") {
//     error.email = "too short";
//   }
//   if (!ema.includes("@") && ema !== "") {
//     error.email = "@ not included";
//   }
//   if (pw.length > 12) {
//     error.password = "max 11 characters";
//   }
//   if (pw.length < 5 && pw.length > 0) {
//     error.password = "Weak";
//   }
//   return error;
// };

class Login extends Component {
  static propTypes = {
    setUser: React.PropTypes.func
  };
  constructor(props) {
    super(props);
    this.state = {
      name: ""
    };
    //this.renderInput = this.renderInput.bind(this);
  }

  setUser(name) {
    this.props.setUser(name);
  }


  componentDidMount() {

    LoginManager.logOut();

    const { navigate } = this.props.navigation;

    //check if user is logged in when component mounts. If logged in navigate to Swipes
    //set flag to redirect only once
    var authFlag = true;
    firebase.auth().onAuthStateChanged( user => {
      //if flag is true, then check if user is signed in, then redirect and turn flag to false, so it doesnt' redirect again. 
      
      //lastLogin = user.lastLoginAt;

      // if(authFlag) {
      //   //check if user is signed in
      //   if (user) {

      //     //WHY DOES PROPERTIES AFTER apiKey ARRAY RETURN UNDEFINED???
      //     console.log('last login is: '+JSON.stringify(user.lastLogin));
      //     console.log('created at is: '+JSON.stringify(user.createdAt));

      //     //if new user, bc they logged in same time as created on time, then redirect to settings. Else redirect to Swipes. 
      //     if (user.lastLoginAt == user.createdAt){
      //       navigate("Settings"); 
      //     }else{
      //       navigate("Swipes"); 
      //     }

      //     // set flag to false so new redirect won't happen. 
      //     authFlag = false;
      //   }
      // }
    });


  }

  // renderInput({
  //   input,
  //   label,
  //   type,
  //   meta: { touched, error, warning },
  //   inputProps
  // }) {
  //   var hasError = false;
  //   if (error !== undefined) {
  //     hasError = true;
  //   }
  //   return (
  //     <Item error={hasError}>
  //       <Icon active name={input.name === "email" ? "person" : "unlock"} />
  //       <Input
  //         placeholder={input.name === "email" ? "EMAIL" : "PASSWORD"}
  //         {...input}
  //       />
  //       {hasError
  //         ? <Item style={{ borderColor: "transparent" }}>
  //             <Icon active style={{ color: "red", marginTop: 5 }} name="bug" />
  //             <Text style={{ fontSize: 15, color: "red" }}>{error}</Text>
  //           </Item>
  //         : <Text />}
  //     </Item>
  //   );
  // }


//function to get update users current location. 
getLocation = (userId) => {

  //save ref to curent user in db. 
  firebaseRefCurrentUser = firebase.database().ref('/users/' + userId);

  //Let's run this code once immeditately after login (login index.js), so that location will only on login instead of every time user. Switch to getCurrentPosition 
  this.watchId = navigator.geolocation.watchPosition(
    (position) => {
      // this is firing 3 times for some reason??? shouldn't be calling google api more than once. 
      // this only fires after phone retart, bad UX when user moves locations re-logs in and location doesn't update. 
      // Why not limit to only NYC metro area. Users selects dropdown with city, while in beta. 
      Geocoder.getFromLatLng(position.coords.latitude, position.coords.longitude).then(
        json => {
          let city_address_component = json.results[0].address_components[3];
          let state_address_component = json.results[0].address_components[5];
          let city_state = city_address_component.long_name+', '+state_address_component.short_name;
        firebaseRefCurrentUser.update({city_state: city_state, latitude: position.coords.latitude, longitude: position.coords.longitude}), navigator.geolocation.clearWatch(this.watchId);
        },
        error => {
          console.log('error getting geo coords: '+error);
        }, 
      )
    },
    { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000, distanceFilter: 300000 },
  );
}


onLoginOrRegister = () => {
  const { navigate } = this.props.navigation;
  LoginManager.logInWithReadPermissions(['public_profile', 'email', 'user_birthday'])
    .then((result) => {

      if (result.isCancelled) {
        return Promise.reject(new Error('The user cancelled the request'));
      }
      // Retrieve the access token
      return AccessToken.getCurrentAccessToken();

    })
    .then((data) => {
      // Create a new Firebase credential with the token
      const credential = firebase.auth.FacebookAuthProvider.credential(data.accessToken);
      // Login with the credential
      return firebase.auth().signInWithCredential(credential);

    })
    .then((user) => {
      let userId = user.uid;
      firebase.database().ref('/users/' + userId).once('value').then((snapshot) => {
      let existing_user = snapshot.exists();
        
        if (existing_user){
          //user already exists
          console.log('user already exists!');

          firebaseRefCurrentUser = firebase.database().ref('/users/' + userId);
          firebaseRefCurrentUser.update({last_login: Date.now()});

            //Let's run this code once immeditately after login (login index.js), so that location will only on login instead of every time user. Switch to getCurrentPosition 
            this.getLocation(userId);
            //will trigger the onAuthStateChanged listener and redirect to swipes
            
            //navigate("Swipes");
            navigate("Intro");

        }else{
        
          //user does not exist yet
         AccessToken.getCurrentAccessToken().then(
            (data) => {
              let accessToken = data.accessToken

              const responseInfoCallback = (error, result) => {
                if (error) {
                  console.log(error)
                  alert('Error fetching data: ' + error.toString());
                } else {
                  fb_result = result;
                  let gender = (fb_result.gender == null) ? 'Select' : fb_result.gender;
                  let birthday = (fb_result.birthday == null) ? 'Select' : fb_result.birthday; 
                  largePhotoURL = "https://graph.facebook.com/"+fb_result.id+"/picture?width=600&height=800";
                  let location = (fb_result.location == null) ? 'Select' : fb_result.location; ////gets the location object you get from your response now
                  let latitude = 40.759211;
                  let longitude = -73.984638;
                  let city_state = 'New York City';

                  let database = firebase.database();

                  // FB.api('/' + location.id, {
                  //     fields: 'location'
                  // }, function(locationResponse) {
                  //     console.log('locationResponse is: '+JSON.stringify(locationResponse)); //will print your desired location object
                  
                  //     let latitude =  locationResponse.latitude;             
                  //     let longitude = locationResponse.latitude;             

                  // });



                  database.ref('users/' + user.uid).set({
                    userid: userId,
                    first_name: fb_result.first_name,
                    fb_id: fb_result.id,
                    last_name: fb_result.last_name,
                    email: fb_result.email,
                    images: [{file: '0', url: largePhotoURL, cache: 'force-cache'}],
                    last_login: Date.now(),
                    swipe_count: 0,
                    last_swipe_sesh_date: Date.now(),
                    latitude: latitude,
                    longitude: longitude,
                    city_state: city_state,
                    gender: gender,
                    gender_pref: gender+'straight',
                    birthday: fb_result.birthday,
                    about: '',
                    work: '',
                    education: '',
                    status: 'active',
                    interested: (fb_result.gender == 'male') ? 'female' : (fb_result.gender == 'female') ? 'male' : 'Select',
                    min_age: 21,
                    max_age: 40,
                    max_distance: 160934.4,
                    error: null,
                    last_conversation_count: 0,
                    notifications_message: true,
                    notifications_match: true,
                    error: null,
                    //religion: fb_result.religion,
                    //political: fb_result.political,
                    //hometown: fb_resutl.hometown
                  }, function(error) {
                    if (error) {
                      console.log("Data could not be saved." + error);
                    } else {
                      console.log("Data saved successfully.");
                      navigate("Intro");
                    }
                  });

                }
              }

              const infoRequest = new GraphRequest(
                '/me',
                {
                  accessToken: accessToken,
                  parameters: {
                    fields: {
                      string: 'email,gender,name,first_name,last_name,birthday'
                    }
                  }
                },
                responseInfoCallback
              );

              // Start the graph request.
              new GraphRequestManager().addRequest(infoRequest).start()

            }
          )

        }

      });
    })
    .catch((error) => {
      const { code, message } = error;
      console.log('error is: '+error);
      // For details of error codes, see the docs
      // The message contains the default Firebase string
      // representation of the error
    });
}


  render() {
    const { navigate } = this.props.navigation;
    return (
      <ImageBackground source={background} style={{width: '100%', height: '100%'}}>
        <View style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <View />
          <Image source={logo} style ={{height: 100}} />
          <Button  style={{alignSelf: 'center', marginBottom: 100}} onPress = {() => this.onLoginOrRegister() }>
            <Text>Login with Facebook</Text>
          </Button>
        </View>
      </ImageBackground>
    );
  }
}

export default Login;
