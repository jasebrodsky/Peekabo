import React, { Component } from 'react';
import { Alert, ScrollView, TouchableOpacity, Image, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import { Modal } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import FontAwesome, { Icons } from 'react-native-fontawesome';
import { DrawerNavigator, NavigationActions } from "react-navigation";
import {
  ActionSheet,
  Card,
  CardItem,
  Container,
  DeckSwiper,
  Header,
  Title,
  Content,
  Text,
  Button,
  Icon,
  Left,
  List,
  ListItem,
  Thumbnail,
  Right,
  Body,
  View, 
} from "native-base";

import { GiftedChat } from 'react-native-gifted-chat';
import TimerCountdown from 'react-native-timer-countdown'

var BUTTONS = ["Unmatch", "Report & Block", "Cancel"];
var DESTRUCTIVE_INDEX = 2;
var CANCEL_INDEX = 2;

class Chat extends Component {

  constructor(props){
    super(props)

    this.state = {
      messages:[],
      blur: null,
      chatActive: true,
      removed: false,
      timeLeft: null,
      matchDate: null,
      name: null,
      birthday: '',
      gender: '',
      city_state: '',
      user_education: '',
      work: '',   
      userName: null,
      userId: null,
      userIdMatch: null,
      imageViewerVisible: false,
      profileMaxHeight: "15%",
      images: [],
      imageIndex: 0,
      about: ''
      //image: null
    }
  }

  //retrive msg from backend
  loadMessages(callback) {
    const { state, navigate } = this.props.navigation;
    conversationId = state.params.match_id;

    this.messageRef = firebase.database().ref('/conversations/'+conversationId+'/messages/');
    this.messageRef.off();
    const onReceive = (data) => {
      const message = data.val();
      callback({
        _id: data.key,
        text: message.text,
        createdAt: new Date(message.createdAt),
        user: {
          _id: message.user._id,
          name: message.user._name,
        }
      });
    };
    this.messageRef.limitToLast(50).on('child_added', onReceive);
  }



  componentWillMount() {

    const { state, navigate } = this.props.navigation;
    const userId = firebase.auth().currentUser.uid;
    let Analytics = RNfirebase.analytics();
    let conversationId = state.params.match_id;
    let images = state.params.images; //might make more sense to pull from db instead of previous componnet, since now won't be able to deeplink into chat
    let about = state.params.about; //might make more sense to pull from db instead of previous componnet, since now won't be able to deeplink into chat
    let birthday = state.params.birthday;
    let gender = state.params.gender;
    let city_state = state.params.city_state;
    let education = state.params.education;
    let work = state.params.work;
    let match_userid = state.params.match_userid; 
    let match_state = state.params.match_state;

    //save fb ref for quering conversation data
    firebaseRef = firebase.database().ref('/conversations/'+conversationId+'/');

    //firebase ref for user in context match obj, used to flag all messages have been read
    firebaseMatchesRef2 = firebase.database().ref('/matches/'+userId+'/'+match_userid+'/');

    //update the unread of my's match obj
    firebaseMatchesRef2.update({
      unread_message: false
    });


   //listen for new conversation data in db
      firebaseRef.on('value', (dataSnapshot) => {

        //create empty array
        var imagesArray = [];
        
        //create valure for the blur radius
        var blurRadius = dataSnapshot.val().blur;

        //get name of user who is not me.
        var participantsList = dataSnapshot.val().participants;

        //convert participants list into array
        var participantArray = Object.entries(participantsList);

        //find participant who is not user in context
        //first users userid
        var participantArrayFirstID = Object.keys(participantsList)[0];

        //second participants userid
        var participantArraySecondID = Object.keys(participantsList)[1];
     
        //if user is first element in participants, then the 2nd element must be participant . 
        if (participantArrayFirstID == userId){
          //participant's  name and images are from second item in array. 
          var participantUser = participantArray['1'];
          var participantLoggedInUser = participantArray['0'];
          var participantUserId = participantArraySecondID;

        }else{
          //participant's  name and images are from first item in array. 
          var participantUser = participantArray['0'];        
          var participantLoggedInUser = participantArray['1'];
          var participantUserId = participantArrayFirstID;

        }

        //save participiant Name
        var participantName = participantUser[1].name;

        //save name of logged in user
        var participantLoggedInUserName = participantLoggedInUser[1].name;

        //save participiant Images
        var imagesList = participantUser[1].images;

        //convert imagesList to an array. 
        var imageArray = Object.values(imagesList);

        //loop through array and create an object now including it's blur radious. Push that object to imagesarray arrary.
        imageArray.forEach(function(item) {
          imageObj = {'url':item.url, cache: 'force-cache', 'props':{'blurRadius': +blurRadius, source: {uri: item.url, cache: 'force-cache'}}};
          imagesArray.push(imageObj);
        })
          //setState with above elements
          this.setState({
            about: about,
            birthday: birthday,
            gender: gender,
            city_state: city_state,
            education: education,
            work: work,
            name: participantName,
            userName: participantLoggedInUserName,
            blur: dataSnapshot.val().blur,
            chatActive: true,
            timeLeft: dataSnapshot.val().time_left, //should be conversation start date. js would subtract today's date from that = time_left
            matchDate: dataSnapshot.val().match_date,
            matchActive: match_state == 'active' ? true : false,
            image: imagesArray[0].url,
            userId: userId,
            userIdMatch: participantUserId,
            images: imagesArray,
            removed: dataSnapshot.val().removed
          }),
          //run analytics
            Analytics.setAnalyticsCollectionEnabled(true);
            Analytics.setCurrentScreen('Chat', 'Chat');
            Analytics.setUserId(userId);

      })
  }

  //send msg to db
  onSend(message) {

    const { state, navigate } = this.props.navigation;
    conversationId = state.params.match_id;
    let Analytics = RNfirebase.analytics();

    firebaseMessagesRef = firebase.database().ref('/conversations/'+conversationId+'/messages/');
    firebaseConversationsRef = firebase.database().ref('/conversations/'+conversationId+'/');
    
    //save firebase refs to update matches with last messages
    firebaseMatchesRef1 = firebase.database().ref('/matches/'+this.state.userIdMatch+'/'+userId+'/');
    firebaseMatchesRef2 = firebase.database().ref('/matches/'+userId+'/'+this.state.userIdMatch+'/');

    //loop through new messages and push back to firebase, which will call loadmessages again. 
    for (let i = 0; i < message.length; i++) {
      firebaseMessagesRef.push({
        text: message[i].text, 
        user: message[i].user, 
        userTo: this.state.userIdMatch,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });

      //update the blur
      if(this.state.blur > 0){
        firebaseConversationsRef.update({
          blur: this.state.blur - 3
        });
      }

      //update the last message and read status of match's match obj
        firebaseMatchesRef1.update({
          last_message: message[i].text,
          last_message_date: (new Date().getTime()*-1), 
          blur: this.state.blur,
          unread_message: (this.state.removed == true) ? false : true //if conversation is removed dont set unread messages to true. 
        });

      //update the last message and read status of match's match obj
        firebaseMatchesRef2.update({
          last_message: message[i].text,
          last_message_date: (new Date().getTime()*-1), 
          blur: this.state.blur
        });

    }

    //Add event for message being sent here. 
    Analytics.logEvent('chatSent', {
      message: message,
      blur: this.state.blur
    });

  }


  goBack() {
    const { navigate } = this.props.navigation;
    this.setState({timeLeft:0}), navigate("Messages");
  }

  CloseChat() {
    if (this.messageRef) {
      this.messageRef.off();
    }
  }

  expiredChat = () => {

    return (
      <View style={{ height: 150, backgroundColor: 'white', alignItems:'center', flexDirection:'column', justifyContent: 'center'}}>
        <Text style = {{paddingBottom: 5, fontWeight: '700'}}>Need some extra time?</Text>
        <Text>Ask for permission to extend</Text>
        <View style={{ paddingTop: 20}}>
          <Button rounded bordered><Text>Extend</Text></Button>
        </View>
      </View>
    );

  }


  //function to toggle profile show/hide
  toggleProfile = () => {

    //if profileMaxHeight is 50%, then change to 15%, else change to 50%
    if (this.state.profileMaxHeight == '15%'){
      this.setState({
        profileMaxHeight: "50%"
      });
    }else{
      this.setState({
        profileMaxHeight: "15%"
      });
    }

    //Add event for message being sent here. 
    Analytics.logEvent('profileViewChat', {
      testParam: 'testParam',
    });

  }

  //function to block or report a profile
  blockOrReport = (type) => {

    //create ref to set new match object with match_id associated with conversation_id generated above. 
    let matchesRef1 = firebase.database().ref('matches/'+userId+'/'+this.state.userIdMatch+'/');

    //create ref to set new match object with match_id associated with conversation_id generated above. 
    let matchesRef2 = firebase.database().ref('matches/'+this.state.userIdMatch+'/'+userId+'/');

    //save fb ref for quering conversation data
    let convoRef = firebase.database().ref('/conversations/'+conversationId+'/');

    //prepare for navigation  
    const { navigate } = this.props.navigation;

    //add removed property to match
    matchesRef1.update({removed: true});

    //add removed property to match
    matchesRef2.update({removed: true});

    //add removed property to conversation as well. 
    convoRef.update({removed: true});

    //record in analytics that user was successfully blocked
    RNfirebase.analytics().logEvent('profileBlocked', {
      userIdBlocking: userId,
      userIdBlocked: this.state.userIdMatch
    }); 

    //if type is report
    if (type == 'report'){
      console.log('profile reported');

      //add reported property to conversation as well. 
      convoRef.update({reported: userId}); 

      //record in analytics that user was successfully reported
      RNfirebase.analytics().logEvent('profileReported', {
        userIdReporting: userId,
        userIdReported: this.state.userIdMatch
      }); 
    }

    //navigate to swipes. 
    navigate("Swipes");
  }


  getAge(dateString) {
      var today = new Date();
      var birthDate = new Date(dateString);
      var age = today.getFullYear() - birthDate.getFullYear();
      var m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
      }
      return age;
  }


  render() {


    const { state, navigate } = this.props.navigation;
    let currentDate = new Date();
    let timeRemaining =  86000000 - (currentDate.getTime() - this.state.matchDate);
    timeRemaining = timeRemaining > 0 ? timeRemaining : 0;
    let {height, width} = Dimensions.get('window');
    let image = this.state.image; //pull first image from images array instead.
    let about = this.state.about;
    let matchActive = this.state.matchActive;
    let name = this.state.name;
    let birthday = this.state.birthday;
    let age = this.getAge(birthday);
    let gender = this.state.gender;
    let city_state = this.state.city_state;
    let education = this.state.education;
    let work = this.state.work;


    return (
      <Container>

          <Modal 
            visible={this.state.imageViewerVisible} 
            transparent={true}
            animationType="slide">

              <ImageViewer 
                index = {this.state.imageIndex}
                imageUrls={this.state.images}
                onChange = {(index) => this.setState({ imageIndex: index})}
                onSwipeDown = {() => this.setState({ imageViewerVisible: false, profileMaxHeight: 66, imageIndex: this.state.imageIndex})}
                onClick = {() => this.setState({ imageViewerVisible: false, profileMaxHeight: 66})}
              />

                <View 
                  flex={0}
                  alignItems="flex-start"
                  justifyContent="center"
                  borderWidth={1}
                  borderColor="grey"
                  borderRadius={5}
                  backgroundColor="white"
                  maxHeight= {this.state.profileMaxHeight} //profileMaxHeight
                  
                >
                  <ScrollView 
                    flexGrow={0}
                    contentContainerStyle={{
                      padding: 15,
                      backgroundColor:'white'
                    }}>
                      <TouchableOpacity onPress={() => this.toggleProfile() }>
                        <View>                        
                          <Text style={{fontWeight: "bold"}} >{name}</Text>                      
                          <Text>{age}, {gender}, {city_state}</Text>
                          <Text style={{marginBottom: 15}} note>{work}</Text>
                          <Text note>{about}</Text>                   
                        </View>
                      </TouchableOpacity>
                  </ScrollView>
                </View>          
          </Modal> 

        <Header>
          <Left>
            <Button transparent onPress={() => this.goBack()}>                              
              <Icon name="ios-arrow-back" />
            </Button>
          </Left>

          <Body>
            <Title>{this.state.name}</Title>
          </Body>

          <Right>
              <Button transparent   onPress={() =>
                  ActionSheet.show(
                    {
                      options: BUTTONS,
                      cancelButtonIndex: CANCEL_INDEX,
                      destructiveButtonIndex: DESTRUCTIVE_INDEX
                      
                    },
                    buttonIndex => {

                      //handle blocking profile
                      if ((buttonIndex) == 0){
                        this.blockOrReport();

                      //handle block and report a user
                      }else if ((buttonIndex) == 1){

                        Alert.alert(
                          'Report & Block',
                          'We take reports seriously and will investigate this person as well as block them from interacting with you in the future. If you just want to unmatch tap "unmatch" instead.',
                          [
                            {text: 'Unmatch', onPress: () => this.blockOrReport()},
                            {text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel'},
                            {text: 'Report & Block', onPress: () => this.blockOrReport('report')},
                          ],
                          { cancelable: false }
                        ) 
                
                      }
                    }
                  )}
            >
                <Icon name="ios-more" />
              </Button>
          </Right>
        </Header>
        
        <View style={{paddingLeft:10, paddingRight:10, alignItems:'center', flexDirection:'row', justifyContent: 'center'}}>
          <Text style={{fontWeight:'600', color:'red', paddingLeft: 5}}>TIME REMAINING: </Text>
          <Text numberOfLines ={1} style={{fontWeight:'400', color:'#888', width:200}}> 
            <TimerCountdown
              initialSecondsRemaining={ timeRemaining }
              onTimeElapsed={() => this.setState({ matchActive: false, timeLeft:0})}
              allowFontScaling={true}
              style={{ fontSize: 20 }}
            />
          </Text> 
              <Icon name="ios-person" onPress={() => this.setState({ imageViewerVisible: true})} style={{fontSize: 30, color: 'grey', paddingTop: 5, paddingRight: 5 }}/>
        </View>

        <View>
          <Image source={{uri: image, cache: 'force-cache'}} position="absolute" resizeMode="cover" blurRadius={Number(this.state.blur)}  
          style={[styles.backgroundImage, {height:height, width: width}]}
          />
        </View>
        

        <GiftedChat
          messages={this.state.messages}
          renderInputToolbar={matchActive == false ? () => null : undefined}
          minInputToolbarHeight = {matchActive == false ? 0 : undefined}
          onSend={
            (message) => {
              this.onSend(message);
            }
          }
          user={{_id: this.state.userId, _name: this.state.userName }}
        />

        {!matchActive &&

        <View style={{ height: 100, backgroundColor: 'white', alignItems:'center', flexDirection:'column', justifyContent: 'center'}}>
          <Text style = {{ fontWeight: '700'}}>This conversation has expired</Text>
          <Text>Better luck next time.</Text>
        </View>
         }

      </Container>
    );
  }


  componentDidMount() {
    this.loadMessages((message) => {
      this.setState((previousState) => {
        return {
          messages: GiftedChat.append(previousState.messages, message)
        };
      });
    });
  }


  componentWillUnmount() {
    () => this.setState({
      timeLeft: undefined
    })
    this.closeChat;
  }

}

let styles = StyleSheet.create({
  backgroundImage: {
  flex: 1,
  backgroundColor:'transparent',
  justifyContent: 'center',
  alignItems: 'center',

 }
});

export default Chat;

