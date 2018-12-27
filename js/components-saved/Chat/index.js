// to do: 
//1. name and image need to be specific to the user who is NOT logged in. 
//  save both images, names, user id's of match particpants in conversation object. Have logic in compoennt to show the image/name of other partiipant, based off userid


import React, { Component } from 'react';
import { connect } from "react-redux";
import { Image, StyleSheet, Dimensions } from 'react-native';
import * as firebase from "firebase";
import { Modal } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import DrawBar from "../DrawBar";
import { DrawerNavigator, NavigationActions } from "react-navigation";
import {
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
  View
} from "native-base";
import { openDrawer } from "../../actions/drawer";
import { GiftedChat } from 'react-native-gifted-chat';
import TimerCountdown from 'react-native-timer-countdown'
import Overlay from 'react-native-modal-overlay';



class Chat extends Component {

  constructor(props){
    super(props)

    this.state = {
      messages:[],
      blur: 60,
      chatActive: true,
      timeLeft: 200,
      name: null,
      userName: null,
      userId: null,
      imageViewerVisible: false,
      images: [],
      //image: null
    }
  }



  static navigationOptions = ({ navigation }) => {
    return {
      title: `Welcome ${navigation.state.params.screen}`,
    }
  };
  static propTypes = {
    name: React.PropTypes.string,
    setIndex: React.PropTypes.func,
    list: React.PropTypes.arrayOf(React.PropTypes.string),
    openDrawer: React.PropTypes.func
  };



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


  CloseChat() {
    if (this.messageRef) {
      this.messageRef.off();
    }
  }

  componentWillMount() {

    const { state, navigate } = this.props.navigation;
    userId = firebase.auth().currentUser.uid;
    conversationId = state.params.match_id;
    images = state.params.images; //might make more sense to pull from db instead of previous componnet, since now won't be able to deeplink into chat
    firebaseRef = firebase.database().ref('/conversations/'+conversationId+'/');

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

        //if user is first element in participants, then the 2nd element must be participant . 
        if (participantArrayFirstID == userId){
          //participant's  name and images are from second item in array. 
          var participantUser = participantArray['1'];
          var participantLoggedInUser = participantArray['0'];
        }else{
          //participant's  name and images are from first item in array. 
          var participantUser = participantArray['0'];        
          var participantLoggedInUser = participantArray['1'];
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
          imageObj = {'url':item.url, 'props':{'blurRadius': +blurRadius}};
          imagesArray.push(imageObj);
        })
          //setState with above elements
          this.setState({
            name: participantName,
            userName: participantLoggedInUserName,
            blur: dataSnapshot.val().blur,
            chatActive: true,
            timeLeft: dataSnapshot.val().time_left,
            image: imagesArray[0].url,
            userId: userId,
            images: imagesArray
          })

      })
  }

  //send msg to db
  onSend(message) {
    const { state, navigate } = this.props.navigation;
    conversationId = state.params.match_id;

    firebaseMessagesRef = firebase.database().ref('/conversations/'+conversationId+'/messages/');
    firebaseConversationsRef = firebase.database().ref('/conversations/'+conversationId+'/');

    //loop through new messages and push back to firebase, which will call loadmessages again. 
    for (let i = 0; i < message.length; i++) {
      firebaseMessagesRef.push({
        text: message[i].text, 
        user: message[i].user, 
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });

      //update the blur
      if(this.state.blur > 0){
        firebaseConversationsRef.update({
          blur: this.state.blur - 3
        });
      }
    }
  }


  
  //need to figure out how to set timeLeft to null when use leaves chat view, so that chat doesnt expire at modal is shown. 
  closeModal() {
    const { navigate } = this.props.navigation;
    this.setState({chatActive:true}), navigate("Swipes");
  }

  goBack() {
    const { navigate } = this.props.navigation;
    this.setState({timeLeft:0}), navigate("Messages");
  }

  render() {


    let {height, width} = Dimensions.get('window');
    const { state, navigate } = this.props.navigation;
    
    let image = this.state.image; //pull first image from images array instead.

    return (
      <Container>
        <Modal visible={this.state.imageViewerVisible} transparent={true}>
            <ImageViewer 
              imageUrls={this.state.images}
              onSwipeDown = {() => this.setState({ imageViewerVisible: false})}
              onClick = {() => this.setState({ imageViewerVisible: false})}
            />
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
          </Right>
        </Header>
        
        <View style={{paddingLeft:10, paddingRight:10, alignItems:'center', flexDirection:'row', justifyContent: 'center'}}>
          <Text style={{fontWeight:'600', color:'red'}}>TIME REMAINING: </Text>
          <Text numberOfLines ={1} style={{fontWeight:'400', color:'#888', width:200}}> 
            <TimerCountdown
              initialSecondsRemaining={this.state.timeLeft}
              onTimeElapsed={() => this.setState({ chatActive: false, timeLeft:0}, console.log(this.state))}
              allowFontScaling={true}
              style={{ fontSize: 20 }}
            />
          </Text> 
              <Icon ios='ios-photos-outline' android="md-photos" onPress={() => this.setState({ imageViewerVisible: true})} style={{fontSize: 30, color: 'black',}}/>
        </View>
        

        <Overlay visible={!this.state.chatActive}
              closeOnTouchOutside animationType="zoomIn"
              containerStyle={{backgroundColor: 'rgba(37, 8, 10, 0.78)'}}
              childrenWrapperStyle={{backgroundColor: '#eee'}}
              animationDuration={500}>

                <Text style={{fontSize:20}}>Conversation Expired :(</Text>
                
                <View style={{margin:20}}>
                  <Text>Sorry about that, every conversation will expires after one week</Text>
                </View>
                
                <View>
                  <Button transparent onPress={() => this.closeModal()} >
            
                    <Text>Ok</Text>
                  </Button>
                </View>
        </Overlay>


        <View>
          <Image source={{uri: image}} position="absolute" resizeMode="cover" blurRadius={Number(this.state.blur)}  
          style={[styles.backgroundImage, {height:height, width: width}]}
          />
        </View>
        

        <GiftedChat
          messages={this.state.messages}
          //onSend={messages => this.onSend2(messages)}
          onSend={
            (message) => {
              this.onSend(message);
            }
          }
          user={{_id: this.state.userId, _name: this.state.userName }}
        />
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
    closeChat();
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

const ChatSwagger = connect(mapStateToProps, bindAction)(Chat);
const DrawNav = DrawerNavigator(
  {
    Home: { screen: ChatSwagger }
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

