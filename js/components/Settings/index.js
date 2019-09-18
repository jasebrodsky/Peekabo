import React, { Component } from 'react';
import { AsyncStorage, Image, ImageBackground, Alert, Dimensions, Modal, StyleSheet, ScrollView, FlatList, Platform, Slider, TouchableOpacity } from 'react-native';
import RNfirebase from 'react-native-firebase';
import { DrawerNavigator, NavigationActions } from "react-navigation";
import DatePicker from 'react-native-datepicker';
import ImagePicker from 'react-native-image-crop-picker';
import MultiSlider from 'react-native-multi-slider';
import ImageViewer from 'react-native-image-zoom-viewer';
import Geocoder from 'react-native-geocoding';
import RNFetchBlob from 'rn-fetch-blob';
import * as firebase from "firebase";
import FontAwesome, { Icons } from 'react-native-fontawesome';

import {
  ActionSheet,
  Card,
  CardItem,
  Container,
  Content,
  DeckSwiper,
  Form,
  Header,
  Title,
  Text,
  Button,
  Icon,
  Item,
  Input,
  Label,
  Picker,
  ListItem,
  Radio,
  Left,
  Thumbnail,
  Toast,
  Right,
  Switch,
  Body,
  View
} from "native-base";

//shortcut to Analytics
// let Analytics = RNfirebase.analytics();

var PHOTO_OPTIONS = [
  'View photo',  
  'Make main photo',
  'Remove photo',
  'Cancel',
];

var GENDER_OPTIONS = [
  'male',
  'female',
  'Cancel',
];

var GENDER_MATCH_OPTIONS = [
  'male',
  'female',
  'both',
  'Cancel',
];
var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

Geocoder.setApiKey('AIzaSyCbt43Up1r0ywnqWX2xxMWGiwWJ3CSBrAI');

class Settings extends Component {

  constructor(props){
    super(props)
    //Analytics.setAnalyticsCollectionEnabled(true);

  this.state = {
      imageViewerVisible: false,
      selectedImage:[{url: ''}],
      profile: {
        showToast: false,
        images: [],
        first_name: null,
        last_name: null,
        latitude: null,
        longitude: null,
        gender: null,
        birthday: 'Select a date',
        interested: null,
        min_age: null,
        max_age: null,
        error: null,
        notifications_message: true,
        notifications_match: true,
        error: null,
        work: '',
        status: 'active'
      }
    }

     userId = firebase.auth().currentUser.uid;
     firebaseRef = firebase.database().ref('/users/' + userId);

  }
  

  //before component mounts, update state with value from database
  componentWillMount() {

    //save data snapshot from firebaseRef
    firebaseRef.on('value', (dataSnapshot) => {
      //update sate with value from dataSnapShot. 
      this.setState({
        profile: dataSnapshot.val()
      }),

    RNfirebase.analytics().setAnalyticsCollectionEnabled(true);
    RNfirebase.analytics().setCurrentScreen('Settings', 'Settings');
    RNfirebase.analytics().setUserId(userId);
    //trigger these user property functions when user updates each of their settings
    RNfirebase.analytics().setUserProperty('name', dataSnapshot.val().first_name+' '+dataSnapshot.val().last_name);
    RNfirebase.analytics().setUserProperty('about', dataSnapshot.val().about);
    RNfirebase.analytics().setUserProperty('birthday', dataSnapshot.val().birthday);
    RNfirebase.analytics().setUserProperty('education', dataSnapshot.val().education);
    RNfirebase.analytics().setUserProperty('gender', dataSnapshot.val().gender);
    RNfirebase.analytics().setUserProperty('gender_pref', dataSnapshot.val().gender_pref);
    RNfirebase.analytics().setUserProperty('interested', dataSnapshot.val().interested);
    RNfirebase.analytics().setUserProperty('status', dataSnapshot.val().status);
    RNfirebase.analytics().setUserProperty('work', dataSnapshot.val().work);
   //convert the below numbers to strings
    RNfirebase.analytics().setUserProperty('last_conversation_count', dataSnapshot.val().last_conversation_count.toString());
    RNfirebase.analytics().setUserProperty('swipe_count', dataSnapshot.val().swipe_count.toString());
    RNfirebase.analytics().setUserProperty('max_age', dataSnapshot.val().max_age.toString());
    RNfirebase.analytics().setUserProperty('max_distance', dataSnapshot.val().max_distance.toString());
    RNfirebase.analytics().setUserProperty('min_age', dataSnapshot.val().min_age.toString());
    RNfirebase.analytics().setUserProperty('last_login', dataSnapshot.val().last_login.toString());
    RNfirebase.analytics().setUserProperty('last_swipe_sesh_date', dataSnapshot.val().last_swipe_sesh_date.toString());
    RNfirebase.analytics().setUserProperty('notifications_match', dataSnapshot.val().notifications_match.toString());
    RNfirebase.analytics().setUserProperty('notifications_message', dataSnapshot.val().notifications_message.toString());
    })

    this.getLocation();

  }  

  //After component mounts prompt for permission to recieve notifications and save fcmToken to database
  componentDidMount() {
    this.checkPermission();
  }  

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId);
    firebaseRef.off(); //detach listener to ref, so that extra fbdb calls arent' made and unmounted component isn't updated
  }


  // check if permission for notification has been granted previously, then getToken. 
  async checkPermission() {
    const enabled = await RNfirebase.messaging().hasPermission();
    if (enabled) {
        this.getToken();
    } else {
        this.requestPermission();
    }
  }

  // getToken if permission has been granted previously
  async getToken() {
    fcmToken = await RNfirebase.messaging().getToken();
    firebaseRef.update({fcmToken: fcmToken});
    // try {
    //   let fcmToken = await AsyncStorage.getItem('fcmToken');
    //   if (!fcmToken) {
    //       fcmToken = await RNfirebase.messaging().getToken();
    //       if (fcmToken) {
    //           // user has a device token

    //           // update fcmToken in firebase
    //           firebaseRef.update({fcmToken: 'fcmToken'});

    //           //set fcmToken to asyncStorage for use later
    //           await AsyncStorage.setItem('fcmToken', fcmToken);
    //       }
    //   }else{
    //     // update fcmToken in firebase
    //     firebaseRef.update({fcmToken: 'fcmToken'});
    //   }     
    // } catch (error) {
    //   console.log('error is: '+error);
    //   firebaseRef.update({fcmToken: fcmToken});

    // }

  }

  // if permission has not been granted, request for permission. 
  async requestPermission() {
    try {
        await RNfirebase.messaging().requestPermission();
        // User has authorised
        this.getToken();
    } catch (error) {
        // User has rejected permissions
        console.log('permission rejected');
    }
  }


  onPressHandle1 = () => {

    //take opposite of current value from state
    let bool = this.state.profile.notifications_message == true ? false : true;

    //record in analytics that user was doesn't want notifications 
    RNfirebase.analytics().setUserProperty('notifications_message', this.state.profile.notifications_message.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_message: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_message: bool}}))

  }

  onPressHandle2 = () => {

    //take opposite of current value from state
    let bool = this.state.profile.notifications_match == true ? false : true;

    //record in analytics that user was doesn't want notifications 
    RNfirebase.analytics().setUserProperty('notifications_match', this.state.profile.notifications_match.toString());

    //update firebase with new value, then update state
    firebaseRef.update({notifications_match: bool})
    .then(this.setState({profile: { ...this.state.profile, notifications_match: bool}}))

  }

  //function to get update users current location. 
  getLocation = () => {

    //save ref to current user in db. 
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


  validateSettings = () => {

    const { state, navigate } = this.props.navigation;

    //check that all required fields are present

    let genderValidated = this.state.profile.gender !== 'Select';
    let interestedValidated = this.state.profile.interested !== 'Select';
    let birthdayValidated = this.state.profile.birthday !== 'Select';

    //alert(genderValidated);

    //if one of gender,interested, birthday is false, ask to update. Else, go to swipes. 
    if ((genderValidated && interestedValidated && birthdayValidated) == false ){

              Toast.show({
                text: "Please update your: gender, birthday, or the gender you would like to meet.",
                buttonText: "OK",
                duration: 3000
              })
      }else{
        //navigate.goBack();
        this.props.navigation.navigate('Swipes');



      }
    }


  //function to sign out user
  signOutUser = async () => {
      const { state, navigate } = this.props.navigation;

      try {
          //record in analytics that user was logged out successfully 
          RNfirebase.analytics().logEvent('userLoggedOut', {
            testParam: 'testParamValue1'
          });
          navigate("Login");
          await firebase.auth().signOut();
      } catch (e) {
          console.log(e);
      }
  }


  //functions to convert miles to/from meters to use for writing/reading from db. 
  getMiles = (i) => Math.round(i*0.000621371192);
  getMeters = (i) => i*1609.344;

  //function to pause user in db
  pauseUser = () => this.updateData('status', userId, 'paused');

  //function to resume user in db
  resumeUser = () => this.updateData('status', userId, 'active');


  //function to guide user through the delete flow
  deleteUser = async () => {
      const { navigate } = this.props.navigation;

      var user = firebase.auth().currentUser;

      //alert user for confirmation. On ok delete user's authentication

      Alert.alert(
        'Are you sure you want to delete your account?',
        'If you delete your account, you will loose touch with everyone within Helm. If you would like to take a break, tap the pause button below',
        [
          {text: 'Delete Account', onPress: () => userDelete(), style: 'destructive'},
          {text: 'Pause', onPress: () => this.pauseUser()},
          {text: 'Cancel', onPress: () => console.log('Canceled')},
        ],
        { cancelable: false }
      )

      //function to delete user
      var userDelete = () => 

        //set user to deleted status in db, then delete authentication, then go to login page. 
        firebaseRef.update({status: 'deleted'}).then(function() {
          user.delete().then(function() {

          //record in analytics that user was deleted successfully 
          RNfirebase.analytics().logEvent('userDeleted', {
            testParam: 'testParamValue1'
          });

          // User deleted.
          navigate("Login");

          }).catch(function(error) {
          // An error happened.
          console.log(error);
        });
      }) 


  }



//update this function to put selected images in storage bucket, then realtime database with URI of images, then connect state to realtime db on change. 
// 1. STORE: put selected images (imagesPhone) in storage bucket
// 2. UPDATE DB: update users/images obj's URI of stored images in realtime db
// 3. REFLECT: when images in db changes, update component state

  pickImage() {

    let imagesLength = Object.keys(this.state.profile.images).length;
    console.log('images length is: '+imagesLength);

    if(imagesLength < 5){
      ImagePicker.openPicker({
        compressImageQuality: 0.2,
        multiple: false,
        forceJpg: true,
        cropping: true,
        width: 600,
        height: 800,
        showCropGuidelines: true,
        mediaType: 'photo',
        includeBase64: true,
        waitAnimationEnd: false,
        includeExif: true,
      }).then(image => {

          //console.log('image is: '+JSON.stringify(image));
          // Create a root reference
          
          var storageRef = firebase.storage().ref(); 

          //create reference to userid from state
          let userid = this.state.userid;

          //count existing images in state and save to var
          // HANDLE WHEN IMAGES ARE EMPTY.. if var == null, var = 0
          var exisiting_images_count = Object.keys(this.state.profile.images).length;
            
            //var image_item_count_start = i+exisiting_images_count;
            var image_item_count_start = exisiting_images_count++;
            //console.log('image_item_count_start: '+image_item_count_start);

            // Create a reference to 'images/userid/i.jpg'
            var imagesRef = storageRef.child('images/'+userId+'/'+image_item_count_start+'.jpg');
    
            // save reference to where to save the new URI 
            var imagesObjRef = firebase.database().ref('/users/'+userId+'/images/');
            
            // Push exisiting images into imagesObj
            var imagesObj = this.state.profile.images;

            //set up properties for image
            let imagePath = image.path;
            let Blob = RNFetchBlob.polyfill.Blob
            let fs = RNFetchBlob.fs
            window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest
            window.Blob = Blob
            let mime = 'image/jpg'
            let uploadUri = Platform.OS === 'ios' ? imagePath.replace('file://', '') : imagePath
            
            // Create file metadata specific to caching.
            let newMetadata = {
              cacheControl: 'public,max-age=31536000',
              contentType: 'image/jpeg'
            }

            //read selected image and build blob          
            fs.readFile(imagePath, 'base64')
              .then((data) => {
                //console.log(data);
                return Blob.build(data, { type: `${mime};BASE64` })
            })
            //then upload blob to firebase storage
            .then((blob) => {
                uploadBlob = blob
                return imagesRef.put(blob, { contentType: mime })
              })
            //then return url of new file from storage
            .then(() => {
              uploadBlob.close();

            // Update metadata properties to image reference
            imagesRef.updateMetadata(newMetadata).then(function(metadata) {
              // Updated metadata for 'images/forest.jpg' is returned in the Promise
              //console.log('metadata is: '+JSON.stringify(metadata));
            }).catch(function(error) {
              // Uh-oh, an error occurred!
              console.log(error);
            })  

              //record in analytics that photo was successfully uploaded 
              RNfirebase.analytics().logEvent('photoUploaded', {
                imageCount: image_item_count_start
              });

              return imagesRef.getDownloadURL()
            })               
            
            //then update all image references for user in multi-path update
            .then((url) => {

              //count existing images in state
              var exisiting_images_count_upload = this.state.profile.images.length;

              //+1 to the exisiting count of images
              var image_item_count_start_upload = exisiting_images_count_upload++;

              // push new image object into imagesObj 
              imagesObj.push({url: url, file: image_item_count_start_upload, cache: 'force-cache'});
              //console.log('imagesObj: '+JSON.stringify(imagesObj));

              //call updateData function with new URI's to pass in multi-path update
              // Can we put this under after all images from phone have been processed to reduce calls to updateData fuction? 
             this.updateData('images', userId, imagesObj );
            
            })
            .catch(console.error);                  
        } 
      ).catch(e => console.log(e));
    }else{

      Alert.alert('Sorry','Please delete a photo first');
    }

  }


  //funtion to scale height of image
  scaledHeight(oldW, oldH, newW) {
    return (oldH / oldW) * newW;
  }

  //function to renderImage into markup
  renderImage(image, key) {


    //console.log('image is: '+JSON.stringify(image));
    return <TouchableOpacity onPress={()=> ActionSheet.show
                      (
                        {
                          options: PHOTO_OPTIONS,
                          cancelButtonIndex: 3,
                          destructiveButtonIndex: 3,
                          title: 'Photo'
                        },
                        (buttonIndex) => {
                          if ((buttonIndex) === 0) {
                              //view image 
                              this.setState({
                                //set image viewer visibility on
                                imageViewerVisible: true,
                                // save to state the selected image to view 
                                selectedImage: [{url: image.url, cache: 'force-cache'}]  
                              })
                            }

                          if ((buttonIndex) === 1) {
                            //make main image 
               
                            //delete object matching key
                            //save original state of images array
                            var arrayImages = [...this.state.profile.images];
                            
                            // save selected image to new variable to re-insert into images later
                            let main_image = arrayImages[key];
                            //console.log('profile images are first: '+JSON.stringify(arrayImages));

                            //save the index of image to remove
                            var index = arrayImages.indexOf(key)
                            
                            //console.log('main image before splice is: '+JSON.stringify(main_image));

                            //remove image at index
                            arrayImages.splice(key, 1);
                            //console.log('profile images after splice: '+JSON.stringify(arrayImages));

                            //console.log('main image after splice is: '+JSON.stringify(main_image));


                            //insert new main image into first position of profile images
                            arrayImages.unshift(main_image);
                            //console.log('profile images after shift: '+JSON.stringify(arrayImages));

                            //set state to new image array
                            this.setState({profile: { ...this.state.profile, images: arrayImages}});                   

                            //multi-path update with new array of images
                            this.updateData('images', userId, this.state.profile.images );

                            //record in analytics that photo was successfully swapped 
                            RNfirebase.analytics().logEvent('newMainPhoto', {
                              testParam: 'testParam'
                            });
                          }

                          if ((buttonIndex) === 2) {

                            //if only one photo exists, disable deleting, else allow user to delete image. 
                            if(this.state.profile.images.length == 1){
                              console.log('LENGTH profile_images in state, wont delete: '+(this.state.profile.images).length);
                              console.log('STATE of profile.imgages in state: '+JSON.stringify(this.state.profile.images));
                              Alert.alert('Sorry','Can not delete only photo');

                            }else{
                              console.log('LENGTH profile_images in state, will delete: '+(this.state.profile.images).length);
                              console.log('STATE of profile.imgages in state: '+JSON.stringify(this.state.profile.images));

                              //remove image
                              //save copy of profile images from state
                              var profile_images = this.state.profile.images; // make a separate copy of the array                                                  
                              //console.log('profile_images in state: '+JSON.stringify(profile_images));
 
                              //remove selected image from storage
                              // Create a reference to the file to delete
                              // Create a root reference
                              var storageRef = firebase.storage().ref(); 

                              //derive which image to delete via the key property on the image object
                              var image_delete = profile_images[key];

                              console.log('profile_images[key]: '+profile_images[key]);

                              // Create a reference to 'images/userid/i.jpg'
                              var imagesRef = storageRef.child('images/'+userId+'/'+image_delete.file+'.jpg');

                              // Delete the file
                              imagesRef.delete().then(function() {
                                // File deleted successfully
                                console.log('deleted successfully');
                              }).catch(function(error) {
                                // Uh-oh, an error occurred!
                                console.log('deleted NOT successfully, error is: '+JSON.stringify(error));
                              });
                                 
                              //save original state of images array
                              var arrayImages = [...this.state.profile.images];
                              
                              //save the index of image to remove
                              var index = arrayImages.indexOf(key)
                              
                              //remove image at index
                              arrayImages.splice(key, 1);
                              
                              //set state to new image array
                              this.setState({profile: { ...this.state.profile, images: arrayImages}});                   

                              //multi-path update with new array of images
                              this.updateData('images', userId, this.state.profile.images );

                              //record in analytics that photo was deleted successfully 
                              RNfirebase.analytics().logEvent('photoDeleted', {
                                testParam: 'testParamValue1'
                              });

                            }
                          }
                        }
                      )
                    } >
              <Image style={{width: 100, height: 100, marginLeft:10 }} source={image} />
          </TouchableOpacity>

  }

  //function to render image or video
  renderAsset(image, key) {
    if (image.mime && image.mime.toLowerCase().indexOf('video/') !== -1) {
      return this.renderVideo(image);
    }

    return this.renderImage(image, key);
  }

  //function to update name or images
  updateData = (type, userid, payload) => {

    //record in analytics the event that a profile was updated successfully 
    RNfirebase.analytics().logEvent('profileUpdated', {
      type: payload
    });


    console.log('type: '+JSON.stringify(type) +'payload length is: '+JSON.stringify(payload.length.toString()));

    //record in analytics the updated user property 
    RNfirebase.analytics().setUserProperty(type, payload.length.toString());
                                                  
    //create ref to list of coversations for userid
    const userConversations = firebase.database().ref('users/'+userid+'/conversations/');

    //create ref to list of matches for userid
    const userMatches = firebase.database().ref('matches/'+userid+'/');

    //create empty placeholder object for all paths to update
    let updateObj = {};

    //return list of all users' conversations
    userConversations.once('value').then(snap => {

      //if user has had a conversation, prepare to update each of their convesations with updated data. 
      if(snap.exists()){

        //turn list of objects into array on it's keys
        let conversationsKeys = Object.keys(snap.val());

        //CONVERSATIONS: add path to update inside updateObj for each conversation record. Switch case for images and name updates. 
        conversationsKeys.forEach((key, $type) => {
          switch (type) {
            case 'images':
              updateObj[`conversations/${key}/participants/${userid}/images`] = payload;
              break;
            case 'name':
              updateObj[`conversations/${key}/participants/${userid}/name`] = payload;            
              break;
          }
        });

      }
    }).then(function() {
 
     //return list of all users' matches
      userMatches.once('value').then(snap => {

        //if user has matches start to prepare updating all matches with new data. 
        if (snap.exists()){

          //turn list of objects into array on it's keys
          let matchesKeys = Object.keys(snap.val());

          //MATCHES: add path to update inside updateObj for each appropriate match record
          matchesKeys.forEach((key, $type) => {
            switch (type) {
              case 'images':
                updateObj[`matches/${key}/${userid}/images`] = payload;
                break;
              case 'name':
                updateObj[`matches/${key}/${userid}/name`] = payload;
                break;
              case 'about':
                updateObj[`matches/${key}/${userid}/about`] = payload;
                break;
              case 'birthday':
                updateObj[`matches/${key}/${userid}/birthday`] = payload;
                break;
              case 'gender':
                updateObj[`matches/${key}/${userid}/gender`] = payload;
                break;
              case 'city_state':
                updateObj[`matches/${key}/${userid}/city_state`] = payload;
                break;
              case 'work':
                updateObj[`matches/${key}/${userid}/work`] = payload;
                break;
              case 'education':
                updateObj[`matches/${key}/${userid}/education`] = payload;
                break;
              case 'status':
                updateObj[`matches/${key}/${userid}/status`] = payload;
                break;
            }
          });
        }
      }).then(function() {

        //USERS: add path to update inside updateObj for userid record
        switch (type) {
          case 'images':
            updateObj[`users/${userid}/images`] = payload;
            break;
          case 'name':
            updateObj[`users/${userid}/first_name`] = payload;
            break;
          case 'about':
            updateObj[`users/${userid}/about`] = payload;
            break;
          case 'work':
            updateObj[`users/${userid}/work`] = payload;
            break;
          case 'education':
            updateObj[`users/${userid}/education`] = payload;
            break;
          case 'status':
            updateObj[`users/${userid}/status`] = payload;
            break;
        }
      }).then(function(){
          //console.log('updateObj outside .then function: '+JSON.stringify(updateObj));
          
          //return statement with updating all the paths that need to be updated
          return firebase.database().ref().update(updateObj);
      })
    })
  }


  //function to generate gender_pref based on users preferences
  updateGenderPref = () => {
    let gender = this.state.profile.gender;
    let interested = this.state.profile.interested;
    let min_age = this.state.profile.min_age;
    let max_age = this.state.profile.max_age;

    // console.log('min age is: '+min_age);
    // console.log('max age is: '+max_age);

    let gender_pref = '';

    // location, age
    // gender pref should be: nyc_male_gay_age
    // so that i can query: all new yorkers, who are men that are gay between the ages of x,y


    //if interested in same gender, then gay
    if (interested == gender){
      gender_pref = gender+'_gay';
    }

    //else if interested in both genders, then bi
    else if (interested == 'both'){
      gender_pref = gender+'_bi';
    }

    //else then straight
    else{
      gender_pref = gender+'_straight';
    }

    //return gender_pref string
    //console.log('gender_pref is: '+gender_pref);

    return gender_pref;
  }

  _onBlur() {
    this._timeoutID = setTimeout(() => {
      alert('blured');

    }, 0);
  }
  
  _onFocus() {
    clearTimeout(this._timeoutID);

    alert('focued');
  }

  _handleClick = (e) => {

    console.log('_handleClick called');
  }



  render() {

    //this.validateSettings;

    const { navigate } = this.props.navigation;
    let status; 

    if (this.state.profile.status == 'paused') {
      status = <Button transparent danger onPress = {() => this.resumeUser()}>
                  <Text>Resume Account</Text>
                </Button> ;

    } else if (this.state.profile.status == 'active') {
      status = <Button transparent danger onPress = {() => this.pauseUser()}>
                  <Text>Pause Account</Text>
                </Button>;
    }

    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width

    //if device width is 414 (iphone+), then margins should be 58, else 40. 
    let genderMargin = deviceWidth == 414 ? 58 : 46;
    let birthdayMargin = deviceWidth == 414 ? 50 : 38;

    //console.log('deviceWidth is: '+deviceWidth);
        
    return (
      <Container>
        <Modal visible={this.state.imageViewerVisible} transparent={true}>
            <ImageViewer 
              imageUrls={this.state.selectedImage}
              onSwipeDown = {() => this.setState({ imageViewerVisible: false})}
              onClick = {() => this.setState({ imageViewerVisible: false})}
            />
        </Modal>   
        <Header>
          <Left >
          </Left>
          <Body style={{ flex: 1,  justifyContent: 'center', alignItems: 'center' }}>
              <FontAwesome style={{fontSize: 32, color: '#B2B2FF'}}>{Icons.cog}</FontAwesome>
          </Body>
          <Right >
            <Button transparent onPress={() => this.validateSettings()}>
              <FontAwesome style={{fontSize: 32, color: '#B2B2FF'}}>{Icons.users}</FontAwesome>
            </Button>
          </Right>
        </Header>
        <Content>
          <DatePicker
            style={{width: 200}}
            date={this.state.profile.birthday}
            mode="date"
            placeholder=""
            format="MM/DD/YYYY"
            minDate="01-01-1940"
            maxDate="01-01-2010"
            confirmBtnText="Confirm"
            cancelBtnText="Cancel"
            ref={(picker) => { this.datePicker = picker; }}
            customStyles={{
              dateIcon: {
                position: 'absolute',
                left: 0,
                top: 4,
                marginLeft: 0,
                width: 0
              },
              dateInput: {
                marginLeft: 36,
                height: 0
              },
              dateTouchBody: {
                width: 0,
                height: 0
              },
              dateText: {
                width: 0
              }
            }}
            onDateChange={(date) => firebaseRef.update({birthday: date})
            .then(this.setState({profile: { ...this.state.profile, birthday: date}}))
            .then(this.updateData('birthday', userId, date))
          }
          />
          <View style={{  flex: 1, padding: 0 }}>
            <Form>
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>I am ...</Text>

              </ListItem> 
              <Item fixedLabel>
                <Label>Name</Label>
                <Input 
                  value={this.state.profile.first_name}
                  onChangeText={(newname) => this.setState({
                                profile: { ...this.state.profile, first_name: newname}
                              })}                  
                  //onEndEditing={(e: any) => firebaseRef.update({first_name: e.nativeEvent.text})}
                
                  onEndEditing={(e: any) => this.updateData('name', userId, e.nativeEvent.text)}

                />
              </Item>
              <Item                
                onPress={()=> ActionSheet.show
                  (
                    {
                      options: GENDER_OPTIONS,
                      cancelButtonIndex: CANCEL_INDEX,
                      destructiveButtonIndex: DESTRUCTIVE_INDEX,
                      title: 'Gender'
                    },
                    (buttonIndex) => {
                      if ((buttonIndex) === 2) {
                           console.log(GENDER_OPTIONS[buttonIndex])
                        } else {
                          this.setState({
                            profile: { ...this.state.profile, gender: GENDER_OPTIONS[buttonIndex]}
                          }), firebaseRef.update({gender: GENDER_OPTIONS[buttonIndex], gender_pref: this.updateGenderPref() }).then(this.updateData('gender', userId, GENDER_OPTIONS[buttonIndex])); 
                        }
                    }
                  )
                }                
              >
                <Label>Gender</Label>
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', marginLeft: genderMargin}}>
                  <Button full disabled transparent dark >
                    <Text>{this.state.profile.gender}</Text>
                  </Button>
                </View>
              </Item>
              
              <Item                 
                onPress = {() => this.datePicker.onPressDate()}
                >
                <Label>Birthday</Label>
            
                <View style={{flex: 1, flexDirection: 'row', justifyContent: 'flex-start', marginLeft: birthdayMargin}}>
                  <Button full disabled transparent dark >
                    <Text>{this.state.profile.birthday}</Text>
                  </Button>
                </View>
              

              </Item>


              
              <Item fixedLabel>
                <Label>Work</Label>
                <Input 
                  value={this.state.profile.work}
                  placeholder='I spend my time on ...'
                  onChangeText={(newwork) => this.setState({
                                profile: { ...this.state.profile, work: newwork}
                              })}                  
                  onEndEditing={(e: any) => firebaseRef.update({work: e.nativeEvent.text})}
                  onEndEditing={(e: any) => this.updateData('work', userId, e.nativeEvent.text)}

                />
              </Item>

              <Item fixedLabel>
                <Label>Education</Label>
                <Input 

                  placeholder='My education is ...'
                  value={this.state.profile.education}
                  onChangeText={(neweducation) => this.setState({
                                profile: { ...this.state.profile, education: neweducation}
                              })}                  
                  onEndEditing={(e: any) => this.updateData('education', userId, e.nativeEvent.text)}             

                />
              </Item>
              <Item fixedLabel>
                <Label>About</Label>
                <Input 
                  style={{minHeight: 50, height: '100%', maxHeight: 150}}
                  multiline={true}
                  placeholder='I am unique because ...'
                  onContentSizeChange={(e) => console.log('updated size')}
                  value={this.state.profile.about}
                  onChangeText={(about) => this.setState({
                                profile: { ...this.state.profile, about: about}
                              })}                  
                  onEndEditing={(e: any) => this.updateData('about', userId, e.nativeEvent.text)}             
                />
              </Item>
              <Item fixedLabel>
                <Text>My photos ...</Text>
                <Input disabled />
              </Item>
              <CardItem>
                <Body>
                    <ScrollView horizontal>
                      <Button onPress={this.pickImage.bind(this)} light style={{ borderRadius: 100, borderWidth: 0.6, borderColor: '#d6d7da',width: 100, height: 100, marginLeft:10, justifyContent: 'center', alignItems: 'center' }}>
                        <Icon  name="ios-add-circle-outline" />
                      </Button>
                      {this.state.profile.images ? Object.entries(this.state.profile.images).map((i, n) => <View key={i[0]}>{this.renderAsset(i[1], i[0])}</View>) : null}                
                    </ScrollView>
                </Body>
              </CardItem>
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>I like ... </Text>
              </ListItem>

              <Item 
                fixedLabel
                    onPress={()=> ActionSheet.show
                      (
                        {
                          options: GENDER_MATCH_OPTIONS,
                          cancelButtonIndex: 3,
                          destructiveButtonIndex: 3,
                          title: 'Gender'
                        },
                        (buttonIndex) => {
                          if ((buttonIndex) === 3) {
                               console.log(GENDER_OPTIONS[buttonIndex])
                            } else {
                              this.setState({
                                profile: { ...this.state.profile, interested: GENDER_MATCH_OPTIONS[buttonIndex]}
                              }), firebaseRef.update({interested: GENDER_MATCH_OPTIONS[buttonIndex], gender_pref: this.updateGenderPref()})
                            }
                        }
                      )
                    } 
                  >
                <Label>Gender</Label>
                <View style={{}}>
                  <Button full disabled transparent dark >
                    <Text>{this.state.profile.interested}</Text>
                  </Button>
                </View>
              </Item>
            
              <Item fixedLabel>
                <Label>Age Range</Label>
                  <MultiSlider 
                    min={21}
                    max={50}
                    values={[30,45]} 
                    unselectedStyle = {{backgroundColor: 'lightgrey'}} 
                    sliderLength={160} 
                    markerStyle={{ height:30, width: 30, borderRadius: 15, backgroundColor:'white', borderWidth: 0.5, borderColor: 'grey'}} 
                    trackStyle={{ borderRadius: 7, height: 2 }} 
                    containerStyle={{ width: 170, top: 12, right:40}}
                    onValuesChange={(val) => 
                        this.setState(prevState => ({
                            profile: {
                                ...prevState.profile,
                                min_age: val[0], max_age: val[1]
                            }
                        }))              
                    }
                    onValuesChangeFinish={(val) => firebaseRef.update({min_age: val[0], max_age: val[1]})}
                  />
                <Text style={{ right:20}}>
                    {this.state.profile.min_age} - {this.state.profile.max_age == 50 ? '50+' : this.state.profile.max_age+' '}
                </Text>
              </Item>

              <Item fixedLabel>
                <Label>Max Dist</Label>
                  <Slider
                   style={{ width: 168, right:40 }}
                   step={10}
                   minimumValue={10}
                   maximumValue={200}
                   value={this.getMiles(this.state.profile.max_distance)}
                   onSlidingComplete={(val) => firebaseRef.update({max_distance: this.getMeters(val)})}
                   onValueChange={(val) => 
                    this.setState({profile: { ...this.state.profile, max_distance: this.getMeters(val)}})
                  }
                />
                <Text style={{ right:20}}>
                    {this.getMiles(this.state.profile.max_distance)} Miles
                </Text>
              </Item>
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>Notify me when...</Text>
              </ListItem>
              

          <ListItem>
            <Left>
              <Label style={{color: "dimgrey"}}>New Message</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_message}
                onValueChange={this.onPressHandle1}
               />
            </Right>
          </ListItem>

          <ListItem>
            <Left>
              <Label style={{color: "dimgrey"}}>New Match</Label>
            </Left>
            
            <Body>              
            </Body>
            
            <Right>
              <Switch 
                value={this.state.profile.notifications_match}
                onValueChange={this.onPressHandle2}
               />
            </Right>
          </ListItem>


          

              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>Contact us about...</Text>
              </ListItem>
              <Item fixedLabel >
                <Label>Help/Support</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel >
                <Label>Rate Us</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel >
                <Label>Privacy Policy</Label>
                <Input disabled />
              </Item>
              <Item fixedLabel >
                <Label>Terms</Label>
                <Input disabled />
              </Item>
              <ListItem style={{flexDirection: "row", justifyContent: "flex-start"}} itemDivider>
                <Text>Other stuff...</Text>
              </ListItem>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent danger onPress = {() => this.signOutUser()}  >
                  <Text>Log out</Text>
                </Button>
              </View>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent danger onPress = {() => this.deleteUser()}>
                  <Text>Delete Account </Text>
                </Button>
              </View>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                {status}
              </View>
            </Form>
          </View>
        </Content>
      </Container>
    );
  }
}


export default Settings;



