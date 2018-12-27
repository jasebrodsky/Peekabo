import React, { Component } from 'react';
import { connect } from "react-redux";
import { Image, Modal, StyleSheet, ScrollView, FlatList, Slider, TouchableOpacity } from 'react-native';
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
  Right,
  Body,
  View
} from "native-base";

import { setIndex } from "../../actions/list";
import { openDrawer } from "../../actions/drawer";

var CITY_OPTIONS = [
  'New York City',  
  'Rio De Janeiro',
  'San Francisco - Coming Soon',
  'Chicago - Coming Soon',
  'Seattle - Coming Soon',
  'Boston - Coming Soon',
  'Cancel',
];

var PHOTO_OPTIONS = [
  'View photo',  
  'Make main photo',
  'Remove photo',
  'Cancel',
];

var GENDER_OPTIONS = [
  'Male',
  'Female',
  'Cancel',
];

var GENDER_MATCH_OPTIONS = [
  'Male',
  'Female',
  'Both',
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
      selectedImage:[{url: 'https://avatars2.githubusercontent.com/u/7970947?v=3&s=460'}],
      profile: {
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


        //HANDLED BELOW! UNCOMMENT AND TEST WITH WIFI!

        // if (this.state.profile.images.length !== null){
        //   exisiting_images_count = this.state.profile.images.length;
        // }else{
        //   exisiting_images_count = 0;
        // }


        //loop through each image in imagesPhone
        for (var i = 0; i < imagesPhone.length; i++) {

          // Save images filename post existing images in order to not replace exisiting files in storage
          var image_item_count_start = i+exisiting_images_count;

          // Create a reference to 'images/userid/i.jpg'
          // HANDLE NON JPG IMAGES
          var imagesRef = storageRef.child('images/'+userId+'/'+image_item_count_start+'.jpg');

          // save selected image into file var
          var file = imagesPhone[i]; 
      
          // save reference to where to save the new URI 
          var imagesObjRef = firebase.database().ref('/users/'+userId+'/images/');
          


          // DON'T NEED TO INTIALIZE imagesObj, because it's when it's saved via state, it's already either empty array or array with objects inside. 
          // REMOVE THE BELOW INTIALIZATION AND RETEST WITH WIFI
          // Create array of images
          //var imagesObj = [];

          // Push exisiting images into imagesObj
          var imagesObj = this.state.profile.images;

          // put into storage as a Base64 formatted string, save to var uploadTask
          var uploadTask = imagesRef.putString(file.data, 'base64');

          //listen to uploadTask and get DownloadURL as download completes, then update database with URI property
          uploadTask
            .then(snapshot => snapshot.ref.getDownloadURL())
            .then((url) => {
              
              // set uri of user's objet image WHY IS ONLY THE LAST ITEM BEING SAVED BELOW?????
              imagesObj.push({url: url, file: image_item_count_start}); 
              
              //call updateNameOrImages function with new URI's to pass in multi-path update
             this.updateNameOrImage('images', userId, imagesObj );
            
            })
            .catch(console.error);
        }
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
                            //MAYBE REMOVE NULLS FROM ...PROFILE_IMAGES, MAYBE THATS BREAKING UPDATENAMEORIMAGE FUNCTION?
                            //console.log('new_profile_images is: '+JSON.stringify(new_profile_images));
                            
                            //multi-path update with new profile images
                            this.updateNameOrImage('images', userId, profile_images );

                            }

                          if ((buttonIndex) === 2) {
                            //remove image
                            //save copy of profile images from state
                            var profile_images = this.state.profile.images; // make a separate copy of the array                                                  
                            
                            //remove selected image from storage
                            // Create a reference to the file to delete
                            
                            // Create a root reference
                            var storageRef = firebase.storage().ref(); 

                            //derive which image to delete via the key property on the image object
                            var image_delete = profile_images[key];

                            // Create a reference to 'images/userid/i.jpg'
                            var imagesRef = storageRef.child('images/'+userId+'/'+image_delete.file+'.jpg');

                            // Delete the file
                            imagesRef.delete().then(function() {
                              // File deleted successfully
                            }).catch(function(error) {
                              // Uh-oh, an error occurred!
                            });

                            //delete object matching key
                            delete profile_images[key];

                            //multi-path update with new array of images
                            this.updateNameOrImage('images', userId, profile_images );

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
  updateNameOrImage = (type, userid, payload) => {
          
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
        }
      }).then(function(){
          //console.log('updateObj outside .then function: '+JSON.stringify(updateObj));
          //return statement with updating all the paths that need to be updated
          return firebase.database().ref().update(updateObj);
      })
    })
  }


  render() {
    const { navigate } = this.props.navigation;
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
            <Button transparent onPress={() => navigate("Swipes")}>
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
                
                  onEndEditing={(e: any) => this.updateNameOrImage('name', userId, e.nativeEvent.text)}

                />
              </Item>
              <Item 
                fixedLabel 
                  onPress={()=> ActionSheet.show
                      (
                        {
                          options: CITY_OPTIONS,
                          cancelButtonIndex: 6,
                          destructiveButtonIndex: 6,
                          title: 'City'
                        },
                        (buttonIndex) => {
                          if ((buttonIndex) === 6) {
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
                              }), firebaseRef.update({gender: GENDER_OPTIONS[buttonIndex]});
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
                  onEndEditing={(e: any) => firebaseRef.update({about: e.nativeEvent.text})}
                />
              </Item>
              <Item fixedLabel>
                <Text>MJKasofny photos ...</Text>
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
                              }), firebaseRef.update({interested: GENDER_MATCH_OPTIONS[buttonIndex]})
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
                <Text>Never do this...</Text>
              </ListItem>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent danger  >
                  <Text>Log out</Text>
                </Button>
              </View>
              <View style={{flexDirection: "row", justifyContent: "center"}}>
                <Button transparent danger>
                  <Text>Delete Account</Text>
                </Button>
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



