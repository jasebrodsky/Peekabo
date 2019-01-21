import React, { Component } from 'react';
import { connect } from "react-redux";
import { Image, Alert, Modal, StyleSheet, ScrollView, FlatList, Slider, TouchableOpacity } from 'react-native';
import DrawBar from "../DrawBar";
import { DrawerNavigator, NavigationActions } from "react-navigation";
import DatePicker from 'react-native-datepicker';
import ImagePicker from 'react-native-image-crop-picker';
import ImageViewer from 'react-native-image-zoom-viewer';
import Geocoder from 'react-native-geocoding';
import * as firebase from "firebase";
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
  ListItem,
  Radio,
  Left,
  Thumbnail,
  Toast,
  Right,
  Body,
  View
} from "native-base";

import { setIndex } from "../../actions/list";
import { openDrawer } from "../../actions/drawer";

var CITY_OPTIONS = [
  'New York City',  
  'Cancel',
];

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
        city_state: null,
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
  
  static navigationOptions = ({ navigation }) => {
    return {
      title: null,
    }
  };
  static propTypes = {
    first_name: React.PropTypes.string,
    setIndex: React.PropTypes.func,
    list: React.PropTypes.arrayOf(React.PropTypes.string),
    openDrawer: React.PropTypes.func
  };

  //before component mounts, update state with value from database
  componentWillMount() {
    //save data snapshot from firebaseRef
    firebaseRef.on('value', (dataSnapshot) => {
      //update sate with value from dataSnapShot. 
      this.setState({
        profile: dataSnapshot.val()
      }) 
    })
  }  

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId);
    firebaseRef.off();
    //alert('component unmounted');
  }

  onPressHandle1 = () => {
     this.setState({ 
      profile: { ...this.state.profile, notifications_message: !this.state.profile.notifications_message}
    }); 
     console.log(this.state);
  }

  onPressHandle2 = () => {
    this.setState({
      profile: { ...this.state.profile, notifications_match: !this.state.profile.notifications_match}
    }); 
     console.log(this.state);
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
        navigate("Swipes");
      }
    }


  //function to sign out user
  signOutUser = async () => {
      const { state, navigate } = this.props.navigation;

      try {
          navigate("Login");
          await firebase.auth().signOut();
      } catch (e) {
          console.log(e);
      }
  }

  //functoin to pause user in db
  pauseUser = () => firebaseRef.update({status: 'paused'});

  //functoin to resume user in db
  resumeUser = () => firebaseRef.update({status: 'active'});

  //function to guide user through the delete flow
  deleteUser = async () => {
      const { navigate } = this.props.navigation;

      var user = firebase.auth().currentUser;

      //alert user for confirmation. On ok delete user's authentication

      Alert.alert(
        'Are you sure you want to delete your account?',
        'If you delete your account, you will loose touch with everyone within Peekabo. If you would like to take a break, tap the pause button below',
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

  pickMultiple() {
    ImagePicker.openPicker({
      compressImageQuality: 0.2,
      multiple: true,
      includeBase64: true,
      waitAnimationEnd: false,
      includeExif: true,
    }).then(imagesPhone => {

        // Create a root reference
        var storageRef = firebase.storage().ref(); 

        //create reference to userid from state
        let userid = this.state.userid;

        //count existing images in state and save to var
        // HANDLE WHEN IMAGES ARE EMPTY.. if var == null, var = 0
        var exisiting_images_count = this.state.profile.images.length;

        //loop through each image in imagesPhone
        // intiate var i at exisiting_images_count+1
        for (var i = 0; i < imagesPhone.length; i++) {

          // Save images filename post existing images in order to not replace exisiting files in storage
          
          //var image_item_count_start = i+exisiting_images_count;
          var image_item_count_start = exisiting_images_count++;
          console.log('image_item_count_start: '+image_item_count_start);


          // Create a reference to 'images/userid/i.jpg'
          // HANDLE NON JPG IMAGES
          var imagesRef = storageRef.child('images/'+userId+'/'+image_item_count_start+'.jpg');

          // save selected image into file var
          var file = imagesPhone[i]; 
      
          // save reference to where to save the new URI 
          var imagesObjRef = firebase.database().ref('/users/'+userId+'/images/');
          
          // Push exisiting images into imagesObj
          var imagesObj = this.state.profile.images;

          // put into storage as a Base64 formatted string, save to var uploadTask
          var uploadTask = Promise.resolve(imagesRef.putString(file.data, 'base64'));

          //listen to uploadTask and get DownloadURL as upload completes, then update database with image object
          uploadTask
            .then(image_item_count_start)
            .then(snapshot => snapshot.ref.getDownloadURL())
            //NEED TO PASS image_item_count_start INTO BELOW, IN ORDER TO ENSURE URL AND FILE PROPERTIES ARE IN SYNC. 
            .then((url) => {

              var exisiting_images_count_upload = this.state.profile.images.length;

              var image_item_count_start_upload = exisiting_images_count_upload++;

              // set uri of user's objet image WHY IS ONLY THE LAST ITEM BEING SAVED BELOW?????
              imagesObj.push({url: url, file: image_item_count_start_upload});

              console.log('imagesObj: '+JSON.stringify(imagesObj));


              // Increaes image_item_count_start by one, after image uplode task complete per individual image asset. 
              //image_item_count_start++;

              //call updateData function with new URI's to pass in multi-path update
              // Can we put this under after all images from phone have been processed to reduce calls to updateData fuction? 
             this.updateData('images', userId, imagesObj );
            
            })
            .catch(console.error);
        }
        //this.updateData('images', userId, imagesObj );

      } 
    ).catch(e => console.log(e));
  }

  //funtion to scale height of image
  scaledHeight(oldW, oldH, newW) {
    return (oldH / oldW) * newW;
  }

  //function to renderImage into markup
  renderImage(image, key) {
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
                                selectedImage: [{url: image.url}]  
                              })
                            }

                          if ((buttonIndex) === 1) {
                            //make main image 

                            //save copy of profile images from state
                            var profile_images = this.state.profile.images; // make a separate copy of the array
               
                            // save selected image to new variable to re-insert into images later
                           //var main_image = {[key]: profile_images[key]};
                            var main_image = profile_images[key];

                            console.log('profile images are first: '+JSON.stringify(profile_images));

                            //delete object matching key
                            delete profile_images[key];

                            console.log('profile images after deletion: '+JSON.stringify(profile_images));
                            //insert new main image into first position of profile images
                            profile_images.unshift(main_image);

                            console.log('profile images after shift: '+JSON.stringify(profile_images));

                            //new_profile_images = [main_image, ...profile_images];
                            //MAYBE REMOVE NULLS FROM ...PROFILE_IMAGES, MAYBE THATS BREAKING updateData FUNCTION?
                            //console.log('new_profile_images is: '+JSON.stringify(new_profile_images));
                            
                            //multi-path update with new profile images
                            this.updateData('images', userId, profile_images );

                            }

                          if ((buttonIndex) === 2) {

                            //if only one photo exists, disable deleting, else allow user to delete image. 
                            if(this.state.profile.images.length == 1){
                              alert('Can not delete only photo');
                            }else{

                              //remove image
                              //save copy of profile images from state
                              var profile_images = this.state.profile.images; // make a separate copy of the array                                                  
                              
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
                                console.log('deleted NOT successfully');
                              });

                              //delete object matching key
                              delete profile_images[key];

                              //multi-path update with new array of images
                              this.updateData('images', userId, profile_images );

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
          
    //create ref to list of coversations for userid
    const userConversations = firebase.database().ref('users/'+userid+'/conversations/');

    //create ref to list of matches for userid
    const userMatches = firebase.database().ref('matches/'+userid+'/');

    //create empty placeholder object for all paths to update
    let updateObj = {};

    //return list of all users' conversations
    userConversations.once('value').then(snap => {

      //console.log('userConversations keys are: '+JSON.stringify(snap));

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
    }).then(function() {
 
     //return list of all users' matches
      userMatches.once('value').then(snap => {

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
          }
        });
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
              <Icon  name="ios-settings-outline" />
          </Body>
          <Right >
            <Button transparent onPress={() => this.validateSettings()}>
              <Icon name="ios-flame-outline" />
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
            .then(this.setState({profile: { ...this.state.profile, birthday: date}}))}
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
                fixedLabel 
                  onPress={()=> ActionSheet.show
                      (
                        {
                          options: CITY_OPTIONS,
                          cancelButtonIndex: 1,
                          destructiveButtonIndex: 1,
                          title: 'City'
                        },
                        (buttonIndex) => {
                          if ((buttonIndex) === 1) {
                               console.log(CITY_OPTIONS[buttonIndex])
                            } 
                            else {
                              this.setState({
                                profile: { ...this.state.profile, city_state: CITY_OPTIONS[buttonIndex]}
                              }), firebaseRef.update({city_state: CITY_OPTIONS[buttonIndex]});
                            }
                        }
                      )
                    }  >
                  <Label>Location</Label>
                  <Input 
                    disabled
                    value={this.state.profile.city_state }
                  />
              </Item>
              <Item 
                fixedLabel
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
                              }), firebaseRef.update({gender: GENDER_OPTIONS[buttonIndex], gender_pref: this.updateGenderPref() });
                            }
                        }
                      )
                    }                
                  >
                <Label>Gender</Label>
                <Input
                  disabled
                  value={this.state.profile.gender} 
                  />
              </Item>
              <Item 
                fixedLabel
                onPress = {() => this.datePicker.onPressDate()}
                >
                <Label>Birthday</Label>
                <Input
                  disabled 
                  value={this.state.profile.birthday}
                  onEndEditing={(e: any) => firebaseRef.update({birthday: e.nativeEvent.text})}
                  onChangeText = {(value) =>this.setState({
                    profile: { ...this.state.profile, birthday: value}
                  })}
                  />
              </Item>
              <Item fixedLabel>
                <Label>Work</Label>
                <Input 
                  value={this.state.profile.work}
                  onChangeText={(newwork) => this.setState({
                                profile: { ...this.state.profile, work: newwork}
                              })}                  
                  onEndEditing={(e: any) => firebaseRef.update({work: e.nativeEvent.text})}
                />
              </Item>

              <Item fixedLabel>
                <Label>Education</Label>
                <Input 
                  value={this.state.profile.education}
                  onChangeText={(neweducation) => this.setState({
                                profile: { ...this.state.profile, education: neweducation}
                              })}                  
                  onEndEditing={(e: any) => firebaseRef.update({education: e.nativeEvent.text})}
                />
              </Item>



              <Item fixedLabel>
                <Label>About</Label>
                <Input 
                  multiline={true}
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
                      <Button onPress={this.pickMultiple.bind(this)} light style={{ borderRadius: 100, borderWidth: 0.6, borderColor: '#d6d7da',width: 100, height: 100, marginLeft:10, justifyContent: 'center', alignItems: 'center' }}>
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
                <Input 
                  disabled 
                  value={this.state.profile.interested} />
              </Item>
              <Item fixedLabel>
                <Label>Min Age</Label>
                  <Slider
                   style={{ width: 200, right:40 }}
                   step={1}
                   minimumValue={18}
                   maximumValue={55}
                   value={this.state.profile.min_age}
                   onSlidingComplete={(val) => firebaseRef.update({min_age: val})}
                   onValueChange={(val) => 
                    this.setState({profile: { ...this.state.profile, min_age: val}})
                  }
                />
                <Text style={{ right:20}}>
                    {this.state.profile.min_age}
                </Text>
              </Item>
              <Item fixedLabel>
                <Label>Max Age</Label>
                  <Slider
                   style={{ width: 200, right:40 }}
                   step={1}
                   minimumValue={18}
                   maximumValue={55}
                   value={this.state.profile.max_age}
                   onSlidingComplete={(val) => firebaseRef.update({max_age: val})}
                   onValueChange={(val) => 
                    this.setState({profile: { ...this.state.profile, max_age: val}})
                  }
                />
                <Text style={{ right:20}}>
                    {this.state.profile.max_age}
                </Text>
              </Item>
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>Notify me when...</Text>
              </ListItem>
              <ListItem>
                <Text>New message</Text>
                <Right>
                  <Radio 
                    selected={this.state.profile.notifications_message} 
                    onPress={this.onPressHandle1}
                    />
                </Right>
              </ListItem>
              <ListItem>
                <Text>New match</Text>
                <Right>
                  <Radio 
                    selected={this.state.profile.notifications_match}
                    onPress={this.onPressHandle2}
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

const SettingsSwagger = connect(mapStateToProps, bindAction)(Settings);
const DrawNav = DrawerNavigator(
  {
    Home: { screen: SettingsSwagger }
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



