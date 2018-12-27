import React, { Component } from "react";
import { Image } from "react-native";
import { connect } from "react-redux";
import * as firebase from "firebase";
import Geocoder from 'react-native-geocoding';
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

import { Field, reduxForm } from "redux-form";
import { setUser } from "../../actions/user";
import styles from "./styles";
import { AccessToken, LoginManager, GraphRequest, GraphRequestManager } from 'react-native-fbsdk';

const background = require("../../../images/red.jpg");

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


onLoginOrRegister = () => {
  const { navigate } = this.props.navigation;
  LoginManager.logInWithReadPermissions(['public_profile', 'email', 'user_location', 'user_hometown', 'user_birthday'])
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
      //navigate("Swipes");
      var userId = firebase.auth().currentUser.uid;
      firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
      var existing_user = snapshot.exists();
        
        if (existing_user){
          //user already exists
          console.log('user already exists!');

          firebaseRefCurrentUser = firebase.database().ref('/users/' + userId);

            //Let's run this code once immeditately after login (login index.js), so that location will only on login instead of every time user. Switch to getCurrentPosition 
            this.watchId = navigator.geolocation.watchPosition(
              (position) => {
                // this is firing 3 times for some reason??? shouldn't be calling google api more than once. 
                // this only fires after phone retart, bad UX when user moves locations re-logs in and location doesn't update. 
                // Why not limit to only NYC metro area. Users selects dropdown with city, while in beta. 
               Geocoder.getFromLatLng(position.coords.latitude, position.coords.longitude).then(
                    json => {
                      var city_address_component = json.results[0].address_components[3];
                      var state_address_component = json.results[0].address_components[5];
                      var city_state = city_address_component.long_name+', '+state_address_component.short_name;
                      console.log(firebaseRefCurrentUser);
                    firebaseRefCurrentUser.update({city_state: city_state, latitude: position.coords.latitude, longitude: position.coords.longitude}), navigator.geolocation.clearWatch(this.watchId);
                    },
                    error => {
                      alert(error);
                    }, 
                  )
              },
              { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000, distanceFilter: 300000 },
            );
            navigate("Swipes");


        }else{
        //user does not exist yet
        alert('user does not exist yet, make profile');

         AccessToken.getCurrentAccessToken().then(
            (data) => {
              let accessToken = data.accessToken
              //alert(accessToken.toString())

              const responseInfoCallback = (error, result) => {
                if (error) {
                  console.log(error)
                  alert('Error fetching data: ' + error.toString());
                } else {
                  console.log(result)
                  fb_result = result;
                  alert('Success fetching data: ' + result.toString());

                  var database = firebase.database();
                  largePhotoURL = "https://graph.facebook.com/"+fb_result.id+"/picture?width=600&height=800";

                  database.ref('users/' + user.uid).set({
                    first_name: fb_result.first_name,
                    fb_id: fb_result.id,
                    last_name: fb_result.last_name,
                    email: fb_result.email,
                    images: [{uri: largePhotoURL}],
                    latitude: null,
                    longitude: null,
                    city_state: fb_result.location.name,
                    gender: fb_result.gender,
                    gender_pref: 'male_straight',
                    birthday: fb_result.birthday,
                    about: 'I am amazing',
                    work: 'Director of awesomenss @ awsomess LLC',
                    education: 'Northeastern University',
                    interested: (fb_result.gender == 'male') ? "female" : "male",
                    min_age: 35,
                    max_age: 23,
                    error: null,
                    notifications_message: true,
                    notifications_match: true,
                    error: null,

                    //religion: fb_result.religion,
                    //political: fb_result.political,
                  });
                  navigate("Settings");

                }
              }

              const infoRequest = new GraphRequest(
                '/me',
                {
                  accessToken: accessToken,
                  parameters: {
                    fields: {
                      string: 'email,gender,name,first_name,last_name,birthday,location,hometown'
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
 
      // If you need to do anything with the user, do it here
      // The user will be logged in automatically by the
      // `onAuthStateChanged` listener we set up in App.js earlier


      // Get a reference to the database service


    })
    .catch((error) => {
      const { code, message } = error;
      // For details of error codes, see the docs
      // The message contains the default Firebase string
      // representation of the error
    });
}



  render() {
    const { navigate } = this.props.navigation;
    return (
      <Container>
        <View style={styles.container}>
          <Content>

            <Image source={background} style={styles.shadow}>
              <View>

              <Icon type="FontAwesome" name="heart" 
                style=
                  {{position: 'absolute', 
                  marginTop: 20,             
                  alignSelf: 'center',
                  fontSize: 100, 
                  color: 'white',
                }} />



                <Text 
                  style={{
                    position: 'relative',
                    marginTop: 120,
                    color: 'white',
                    fontSize: 70, 
                    textAlign: 'center',
                    fontStyle: 'italic'
                    }}>Peekaboo</Text>
                <Button
                  style={styles.btn}
                  onPress = {() => this.onLoginOrRegister() }
                  //onPress={() => navigate("Swipes")}
                >
                  <Text>Login with Facebook</Text>
                </Button>

              </View>
            </Image>
          </Content>
        </View>
      </Container>
    );
  }
}
const LoginSwag = reduxForm(
  {
    form: "test",
  },
  function bindActions(dispatch) {
    return {
      setUser: name => dispatch(setUser(name))
    };
  }
)(Login);
LoginSwag.navigationOptions = {
  header: null
};
export default LoginSwag;
