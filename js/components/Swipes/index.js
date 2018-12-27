import React, { Component } from 'react';
import { connect } from "react-redux";
import { Image,TouchableOpacity,Modal,ScrollView,StyleSheet,Text,View,TouchableWithoutFeedback } from 'react-native'
import DrawBar from "../DrawBar";
import * as firebase from "firebase";
import { DrawerNavigator, NavigationActions } from "react-navigation";
import ImageViewer from 'react-native-image-zoom-viewer';
import Overlay from 'react-native-modal-overlay';
import ProgressCircle from 'react-native-progress-circle';
import Swiper from 'react-native-deck-swiper';

import {
  Card,
  CardItem,
  Container,
  DeckSwiper,
  Header,
  Title,
  Content,
  Button,
  Icon,
  Left,
  Thumbnail,
  Right,
  Body,
} from "native-base";

import { setIndex } from "../../actions/list";
import { openDrawer } from "../../actions/drawer";

class Swipes extends Component {
  
  constructor (props) {
    super(props)
    this.state = {
      userId: '',
      user_name: null,
      user_images: '',
      profiles: [],
      loading: true,
      imageViewerVisible: false,
      matchModalVisible: false,
      query_start: null,
      query_end: null,
      cardIndex: 0
    }
  }


  componentWillMount() {

  //Retrive information about the logged in user
  
  //save userId of logged in user, to use for later db queries. 
  const userId = firebase.auth().currentUser.uid;
  this.setState({ userId: userId });
  //save ref to users obj of db
  usersRef = firebase.database().ref('users');

  //query for logged in users preferences. 
  firebase.database().ref('/users/' + userId).once('value')
  .then(function(snapshot) {

    //save users' preferences in order to use later for quering users that are relevant matches. 
    //let gender = snapshot.val().gender;
    //let interested = snapshot.val().interested;
    let latitude = snapshot.val().latitude;
    let longitude = snapshot.val().longitude;
    let max_age = snapshot.val().max_age;
    let min_age = snapshot.val().min_age;
    let gender_pref = snapshot.val().gender_pref;
    let user_name = snapshot.val().first_name;
    let user_images = snapshot.val().images;

    // translate user's gender_pref into who they're interested in. 
    switch (gender_pref) {
      case 'female_straight':
        var query_start = 'male_bi';
        var query_end = 'male_straight';
        console.log(query_start + query_end);
        //above query will include male_gay since it's inbetween male_bi and male_straight
        break;
      case 'male_straight':
        var query_start = 'female_bi';
        var query_end = 'female_straight';
        console.log(query_start + query_end);
        break;
      case 'male_gay':
        var query_start = 'male_bi';
        var query_end = 'male_gay';
        console.log(query_start + query_end);
        break;
      case 'female_gay':
        var query_start = 'female_bi';
        var query_end = 'female_gay';
        console.log(query_start + query_end);
        break;
      // case 'male_bi':
      //   console.log('female_straight' + 'female_bi' +'AND'+ 'male_gay' + 'male_bi');
      //   let query_start = 'male_bi';
      //   let query_end = 'male_straight';
      //   break;
      // case 'female_bi':
      //   console.log('male_straight' + 'male_bi' +'AND'+ 'female_gay' + 'female_bi');
      //   let query_start = 'male_bi';
      //   let query_end = 'male_straight';
      //   break;
      default:
        console.log('Sorry, we are out of ' + expr + '.');
    }


    //update state with gender_pref. After state updated, build profile query. 
    this.setState({ user_name: user_name, user_images: user_images, query_start: query_start, query_end: query_end }, function() {

        //Retrive list of other relevant users.
        //create empty profiles array of objects, which will hold relevant profiles 
        var profilesArray=[];
        
        //Update query to include preferences, past swipes,...
        //var profilesRef = usersRef.orderByChild('gender_pref').startAt(this.state.query_start).endAt(this.state.query_end);

        //TEST QUERY ALL USERS
        var profilesRef = usersRef.orderByChild('gender_pref');

        //push each profile into array. TRY Object.entities(snap)
        profilesRef.once('value').then((snap) => {
            snap.forEach(function(item ) {
                //push to new array. 
                profilesArray.push(item);

                //update state with appropriate profiles data for deckswiper. 
            }), this.setState({profiles: profilesArray, loading: false})
          })
        });
      }.bind(this)
    )
  }

//Close match modal. Eventually redirect directly to chat componenent specific to match's conversation. 
closeModal(redirect) {
  const { navigate } = this.props.navigation;
  this.setState({matchModalVisible:false});
  if(redirect == true){
    navigate("Messages");
  }
}

showModal() {
  this.setState({matchModalVisible:true});
}


//function to call when a new match is intiated.
pushNewMatch = (images, name_match, userid, userid_match) => {
  
  user_name = this.state.user_name;
  user_images = this.state.user_images;

  //create ref to conversations obj
  conversationRef = firebase.database().ref('conversations/');

  //push new conversation obj for new match
  //make sure that users who already matched, don't show up in match queue. Otherwise duplicate conversations will occur.  
  var newConversationRef = conversationRef.push({
      blur: "40", //start blur at this amount
      messages: null,
      participants: {
        [userid_match]: {
          name: name_match,
          images: images
        },
        [userid]: {
          name: this.state.user_name,
          images: this.state.user_images
        }
      },
      time_left: '86400000', //default timeleft
      active: 'true',
      match_date: new Date().getTime()
    }, function (error) {
      if (error) {
        //if push fails
        alert("Data could not be saved." + error);
      } else {
        //if push is successful, set new match object as well. 
        console.log("Data saved successfully.");
      
        // Get the unique key generated by push(), for the match_id value. 
        let match_id = newConversationRef.key;

        //create ref to set new match object with match_id associated with conversation_id generated above. 
        let matchesRef1 = firebase.database().ref('matches/'+userid+'/'+userid_match+'/');

        //create ref to set new match object with match_id associated with conversation_id generated above. 
        let matchesRef2 = firebase.database().ref('matches/'+userid_match+'/'+userid+'/');

        //create ref to set new conversations key/value pair witin users object.
        let conersationsMatchesRef1 = firebase.database().ref('/users/'+userid+'/').child("conversations");

        //create ref to set new conversations key/value pair witin users object.
        let conersationsMatchesRef2 = firebase.database().ref('/users/'+userid_match+'/').child("conversations");

        //set new match object
        matchesRef1.set({
          blur: "40", //start blur at this amount
          images: images, //pass images in here
          last_message: "You got a new match!", 
          name: name_match,
          percent_left: '90',
          time_left: 86400000,
          active: 'true',
          match_date: new Date().getTime(),
          match_id: match_id
        });

        //set new match object
        matchesRef2.set({
          blur: "40", //start blur at this amount
          images: user_images, //pass images in here
          last_message: "You got a new match!", 
          name: user_name,
          percent_left: '90',
          time_left: 86400000,
          active: 'true',
          match_date: new Date().getTime(),
          match_id: match_id
        });
      
        //USE MULTIPLE PATH UPDATING FOR BELOW TWO UPDATES

        //push new conversation to profile object.
        conersationsMatchesRef1.update({
          [match_id] : 'true'
      });

        //push new conversation to others' profile object.
        conersationsMatchesRef2.update({
          [match_id] : 'true'
      });


    }
  });
}

//Function to save new swipe object
pushNewSwipe = (like, userid, userid_match, potential_match, name_match, imagesObj) => {
  //define ref to users' swipe object
  swipesRef = firebase.database().ref('swipes/'+userid+'/'+userid_match+'/');
  //set or replace users swipe with latest swipe
  swipesRef.set({
    like: like,
    swipe_date: new Date().getTime(),
    //images: imagesObj
  });

  //if user is potential match, then 
    // create new match object
    if (potential_match==true) { 
       //alert("save new match!");
       this.pushNewMatch(imagesObj, name_match, userid, userid_match);
    }

    //queue notification that new match is available in 30 seconds

    //send push notification to other user
}


//Function to save new swipe object
calculateAge (dateString) {// birthday is a date
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

  //handle swipe events
  onSwiped = (cardIndex, direction, potential_match) => {
    // save variable for direction of swipe
    let like = (direction == 'right') ? true : false;
    // save to firebase db swipe event and possible match
    this.pushNewSwipe(
          like, //like
          this.state.userId, //userid
          this.state.profiles[cardIndex].key, //userid match
          potential_match, // potential match
          this.state.profiles[cardIndex].toJSON().first_name, //match name
          this.state.profiles[cardIndex].toJSON().images //matche images
        ),this.setState({ cardIndex: cardIndex+1});//update card index in state, so that image modal has correct images 
  };


  render () {
    const { navigate } = this.props.navigation;

    //bool when profiles have been fetched, so that empty image array doesn't break modal
    const showModal = this.state.profiles.length>1;
    let cardIndex = this.state.cardIndex;
    let modal;

    //if profile are fetched
    if (showModal) {
      modal = 
      <Modal visible={this.state.imageViewerVisible} transparent={true}>
          <ImageViewer
            imageUrls = {Object.values(this.state.profiles[cardIndex].toJSON().images)}
            onSwipeDown = {() => this.setState({ imageViewerVisible: false})}
            onClick = {() => this.setState({ imageViewerVisible: false})}
          />
          <Text style={{padding: 15,backgroundColor:'white', color:'black'}}>
            {this.state.profiles[cardIndex].toJSON().about}
          </Text>
      </Modal> ;
    }

    return (
      <Container style={{ flex: 1 }} >
          <Header>
            <Left>
              <Button transparent onPress={() => navigate("Settings")}>
                <Icon name="ios-settings-outline" />
              </Button>
            </Left>
            <Body>
                <Icon onPress={() => this.showModal()} name="ios-flame-outline" />
            </Body>
            <Right>
              <Button transparent onPress={() => navigate("Messages")}>
                <Icon name="ios-chatboxes-outline" />
              </Button>
            </Right>
          </Header>
        <View style={{ marginTop: -50}}>
          <Swiper
            ref={swiper => {
              this.swiper = swiper
            }}
            onTapCard={() => this.setState({ imageViewerVisible: true})} 
            cardIndex={this.state.cardIndex}
            backgroundColor={'#4FD0E9'}
            stackSeparation={12}
            stackSize={10}
            cards={this.state.profiles}
            onSwipedRight={(index) => this.onSwiped(index,'right',true)} 
            onSwipedLeft={(index) => this.onSwiped(index,'left',false)} 
            overlayLabels={{
              bottom: {
                title: 'Date with Jason',
                style: {
                  label: {
                    backgroundColor: 'black',
                    borderColor: 'black',
                    color: 'white',
                    borderWidth: 1
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }
              },
              left: {
                title: 'NOPE',
                style: {
                  label: {
                    backgroundColor: 'black',
                    borderColor: 'black',
                    color: 'white',
                    borderWidth: 1
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    marginTop: 30,
                    marginLeft: -30
                  }
                }
              },
              right: {
                title: 'LIKE',
                style: {
                  label: {
                    backgroundColor: 'black',
                    borderColor: 'black',
                    color: 'white',
                    borderWidth: 1
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    marginTop: 30,
                    marginLeft: 30
                  }
                }
              },
              top: {
                title: 'SUPER LIKE',
                style: {
                  label: {
                    backgroundColor: 'black',
                    borderColor: 'black',
                    color: 'white',
                    borderWidth: 1
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                }
              }
            }}
            //keyExtractor={(cardData) => {alert('card key is: '+cardData.key)}}

            renderCard={(card,index) => {
                var item =JSON.parse(JSON.stringify(card));

                return (
                  <Card style={{ elevation: 3 }}>

                    <CardItem cardBody>
                      <View >
                        <Image
                          style={{ height: 510, width: 370}}
                          source={{uri: Object.values(item.images)[0].url}}
                        />
                      </View>
                     </CardItem>
                    <CardItem>
                      <Left>
                        <Body>
                          <Text style={{fontWeight: "bold"}} >{this.calculateAge(item.birthday)}, {item.gender}, {item.city_state}</Text>
                          <Text style={{marginBottom: 4}} note>{item.work} </Text>
                          <Text numberOfLines={2} note>{item.about} </Text>
                        </Body>
                      </Left>
                    </CardItem>
                  </Card>
                )
            }}>
          </Swiper>
          {modal}
        </View>

        <Overlay visible={this.state.matchModalVisible}
          closeOnTouchOutside = {true}
          animationType="zoomIn"
          onClose={() => this.closeModal()}
          containerStyle={{backgroundColor: 'rgba(37, 8, 10, 0.78)'}}
          childrenWrapperStyle={{backgroundColor: '#eee'}}
          animationDuration={500}
        >
            <Text style={{fontSize:40, margin:10}}> New Match!</Text>
             <ProgressCircle
                  percent={95}
                  radius={120}
                  borderWidth={5}
                  color = '#3399FF'
                  shadowColor="#999"
                  bgColor="#fff" 
                  >
                <TouchableOpacity activeOpacity={1} onPress={() => this.closeModal(true)}>
                  <Thumbnail 
                    blurRadius={25} 
                    source={{uri: "https://firebasestorage.googleapis.com/v0/b/blurred-195721.appspot.com/o/images%2Ftest.jpg?alt=media&token=d8d75170-a79f-4437-9633-47b5682e064f"}} 
                    style={{ 
                      width: 250, 
                      height: 250
                    }}/>
                </TouchableOpacity>
              </ProgressCircle>
                <View style={{width: 180, margin:20}}>
                  <Text style={{textAlign:'center'}}>Send them messages to unblur their photo</Text>
                </View>
                <View style={{
                  margin: 10, 
                  borderTopColor: '#bbb',
                  borderTopWidth: 1,
                  width: 300 
                }}>

                </View>
                <View>
                    <Button transparent onPress={() => this.closeModal(true)} >
                      <Text>Talk to Andrea</Text>
                    </Button>
                </View>
        </Overlay>
      </Container>
    )
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

const SwipesSwagger = connect(mapStateToProps, bindAction)(Swipes);
const DrawNav = DrawerNavigator(
  {
    Home: { screen: SwipesSwagger }
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
