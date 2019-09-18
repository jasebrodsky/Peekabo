import React, { Component } from 'react';
import { Dimensions, ActivityIndicator, ImageBackground, TouchableOpacity, TouchableHighlight, Modal,ScrollView,StyleSheet,Share,Text,View,TouchableWithoutFeedback } from 'react-native'
import RNFirebase from "react-native-firebase";
import * as firebase from "firebase";
import { DrawerNavigator, NavigationActions } from "react-navigation";
import ImageViewer from 'react-native-image-zoom-viewer';
import Overlay from 'react-native-modal-overlay';
import ProgressCircle from 'react-native-progress-circle';
import Swiper from 'react-native-deck-swiper';
import TimerMixin from 'react-timer-mixin';
import FontAwesome, { Icons } from 'react-native-fontawesome';

import {
  Badge,
  Card,
  CardItem,
  Container,
  DeckSwiper,
  Header,
  Title,
  Toast,  
  Content,
  Button,
  Icon,
  Left,
  Thumbnail,
  Right,
  Body
} from "native-base";


class Swipes extends Component {
  
  constructor (props) {
    super(props)
    this.state = {
      userId: '',
      user_name: null,
      user_images: '',
      user_about: '',
      user_birthday: '',
      user_gender: '',
      user_city_state: '',
      user_education: '',
      user_work: '',
      matchImages: [{url: 'https://image.nj.com/home/njo-media/width620/img/entertainment_impact/photo/lil-bub-catsbury-park-cat-convention-asbury-park-2018jpg-42ba0699ef9f22e0.jpg'}],
      matchAbout: '',
      profiles: [],
      loading: true,
      unreadChatCount: 0,
      showChatCount: false,
      isEmpty: false,
      allSwiped: false,
      imageViewerVisible: false,
      profileMaxHeight: "15%",
      swipesStatsShow: false,
      swipeCountStart: 0,
      query_start: null,
      query_end: null,
      cardIndex: 0
    }
  }

  componentDidMount() {

    //save userId of logged in user, to use for later db queries. 
    const userId = firebase.auth().currentUser.uid;
    this.setState({ userId: userId });

    //get unread chat count
    this.getUnreadChatCount(userId);
    
    //getMatches of current user
    this.getMatches(userId);

    //run newBatch in order to reset swipe count to 0 at the right time. 
    this.newBatch(userId);

    //query for logged in users information needed and set state with it.     
    firebase.database().ref('/users/' + userId).once('value', ((snapshot) => {
                
        //set state with user data. 
        this.setState({ 
            user_name: snapshot.val().first_name,
            user_images: snapshot.val().images,
            user_about: snapshot.val().about,
            user_birthday: snapshot.val().birthday,
            user_gender: snapshot.val().gender,
            user_city_state: snapshot.val().city_state,
            user_education: snapshot.val().education,
            user_work: snapshot.val().work,
            swipeCountStart: snapshot.val().swipe_count         
        }),
          RNFirebase.analytics().setAnalyticsCollectionEnabled(true);
          RNFirebase.analytics().setCurrentScreen('Swipes', 'Swipes');
          RNFirebase.analytics().setUserId(userId);

          console.log('snapshot.val().swipe_count is: '+snapshot.val().swipe_count);

       })
      )
    }

    getUnreadChatCount = (userId) => {

        firebase.database().ref('/matches/' + userId).orderByChild('unread_message').equalTo(true).on('value', ((chatSnapshot) => {

         console.log('unread chats are: '+JSON.stringify(chatSnapshot.val())) ; 
          // if chat count is not empty, update state with count and set flag to true. Else, make sure to set flag to false. 
          if(chatSnapshot.val() !== null){
                   
            // chatArray = Object.entries(chatSnapshot).filter(function( obj ) {
            //     return obj.removed !== true;
            // });

            //set state with chat count. 
            this.setState({
              unreadChatCount: Object.keys(chatSnapshot.toJSON()).length,
              showChatCount: true
            }) 
          }else{
            this.setState({
              unreadChatCount: 0,
              showChatCount: false
            }) 

          }
        })
      )
    }


  componentWillUnmount() {
    //unmount listener for below ref
    firebase.database().ref('/matches/' + userId).off('value');
  }

  getMatches(userId) {
    fetch('https://us-central1-blurred-195721.cloudfunctions.net/getMatches?userid='+userId)
      .then((response) => response.json())
      .then((responseJson) => {
        
        console.log('responseJson is: '+JSON.stringify(responseJson));

        // for each match userid inside responeJson
        let promises = responseJson.map((match) => {
          
          //save match userid per match into var, needed to select props of that obj.
          let matchUserId = Object.keys(match);
          // select matchType of per match
          let matchType = match[matchUserId].matchType;

          //call firebase to return profile data per match
          return firebase.database().ref('/users/' + matchUserId).once('value')
          .then((profileSnap) => {
       
            //save profileSnap to json var in order to add match type prop to it
            let profileObj = profileSnap.toJSON();

            //add new property match_type to object
            profileObj["match_type"] = matchType;

            //Return profile obj to promise. 
            return profileObj;
          })
        })

        // after all promises resolve, then set profileObj to state. 
        Promise.all(promises).then((profileObj) => {
          
          //if profile objs are empty or undefined show flag empty profiles else put profile into state
          if (profileObj === undefined || profileObj.length == 0) {
            //turn empty flag to true
            this.setState({ 
              isEmpty: true,
              allSwiped: true,
              loading: false
            });  

            // else put profilObjs into state
          }else{
            this.setState({ 
              profiles: profileObj,
              loading: false
            });
          }
       
        })
    })  
  }


  //Close match modal. Eventually redirect directly to chat componenent specific to match's conversation. 
  closeModal(redirect) {
    const { navigate } = this.props.navigation;
    this.setState({swipesStatsShow:false});
    if(redirect == true){
      navigate("Messages");
    }
  }

  showModal() {
    this.setState({swipesStatsShow:true});
  }


  //function to call when a new match is intiated.
  pushNewMatch = (images, name_match, userid, userid_match, about_match, birthday_match, gender_match, city_state_match, education_match, work_match) => {

    user_name = this.state.user_name;
    user_images = this.state.user_images;
    user_about = this.state.user_about;
    user_birthday = this.state.user_birthday;
    user_gender = this.state.user_gender;
    user_city_state = this.state.user_city_state;
    user_education = this.state.user_education;
    user_work = this.state.user_work;

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
          let conversationsMatchesRef1 = firebase.database().ref('/users/'+userid+'/').child("conversations");

          //create ref to set new conversations key/value pair witin users object.
          let conversationsMatchesRef2 = firebase.database().ref('/users/'+userid_match+'/').child("conversations");

          //set new match object
          matchesRef1.set({
            blur: "40", //start blur at this amount
            images: images, //pass images in here
            last_message: "You got a new match!", 
            last_message_date: (new Date().getTime()*-1), 
            name: name_match,
            birthday: birthday_match ,
            gender: gender_match,
            city_state: city_state_match,
            education: education_match,
            work: work_match,
            active: 'true',
            match_date: new Date().getTime(),
            match_id: match_id,
            match_userid: userid_match,
            about: about_match,
            unread_message: false
          });

          //set new match object
          matchesRef2.set({
            blur: "40", //start blur at this amount
            images: user_images, //pass images in here
            last_message: "You got a new match!",
            last_message_date: (new Date().getTime()*-1), 
            name: user_name,
            birthday: user_birthday,
            gender: user_gender,
            city_state: user_city_state,
            education: user_education,
            work: user_work,
            active: 'true',
            match_date: new Date().getTime(),
            match_id: match_id,
            match_userid: userid,
            about: user_about,
            unread_message: false
          });
        
          //USE MULTIPLE PATH UPDATING FOR BELOW TWO UPDATES

          //push new conversation to profile object.
          conversationsMatchesRef1.update({
            [match_id] : 'true'
        });

          //push new conversation to others' profile object.
          conversationsMatchesRef2.update({
            [match_id] : 'true'
        });

        // let Analytics = RNFirebase.analytics();
        RNFirebase.analytics().logEvent('matchEvent', {
          match: userid_match.toString()
        });


      }
    });
  }

  //Function to save new swipe object
  pushNewSwipe = (like, userid, userid_match, match_status, name_match, about_match, imagesObj, birthday_match, gender_match, city_state_match, education_match, work_match) => {

    //save potential_match into bool var. 
    //let potential_match = (match_status == 'potential_match') ? true : false;
    let potential_match = true;


    //define ref to users' swipe object
    swipesRef = firebase.database().ref('swipes/'+userid+'/'+userid_match+'/');

    swipesRef2 = firebase.database().ref('swipesReceived/'+userid_match+'/'+userid+'/');
    //set or replace users swipe with latest swipe
    swipesRef.set({
      like: like,
      swipe_date: new Date().getTime(),
      //images: imagesObj
    });

    swipesRef2.set({
      like: like,
      swipe_date: new Date().getTime(),
      //images: imagesObj
    });

    //if user is potential match, then 
      // create new match object
      if ((potential_match == true) && (like == true)) { 
         //alert("save new match!");
         this.pushNewMatch(imagesObj, name_match, userid, userid_match, about_match, birthday_match, gender_match, city_state_match, education_match, work_match);
      }

        // let Analytics = RNFirebase.analytics();
        RNFirebase.analytics().logEvent('swipeEvent', {
          like: like.toString()
        });

  }

  //Share function when sharing referral code native share functionality. 
  onShare = () => {

    //fetch from getCode cloud function
    fetch('https://us-central1-blurred-195721.cloudfunctions.net/getCode?userid='+this.state.userId)
    .then((response) => response.json())
    .then((responseJson) => {
               
        //save code var.
        let code = responseJson.sharable_code;
        let codeDelete = responseJson.code_id;

        //prompt native share functionality 
        Share.share({
          message: 'I think you\'ll love Helm. It\'s a different type of dating where only men invited by women can join. You\'ll need this code to enter: '+code,
          url: 'https://itunes.apple.com/us/app/hinge/id595287172',
          title: 'Wow, have you seen this yet?'
        }).then(({action, activityType}) => {
          if(action === Share.dismissedAction) {
            //delete unsent code from db
            firebase.database().ref('codes/' + codeDelete).remove();

          } 
          else {
            console.log('Share successful');
          }
        })
    })
    .catch(function(error) {
        alert("Data could not be saved." + error);
    });
  };

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

    // let Analytics = RNFirebase.analytics();
    RNFirebase.analytics().logEvent('profileViewSwipes', {
      testParam: 'testParamValue1'
    });

}

  //handle swipe events
  onSwiped = (cardIndex, direction) => {
    // save variable for direction of swipe
    let like = (direction == 'right') ? true : false;

    // save to firebase db swipe event and possible match
    this.pushNewSwipe(
          like, //like
          this.state.userId, //userid
          this.state.profiles[cardIndex].userid, //userid match
          this.state.profiles[cardIndex].match_type, // potential match // this.state.profiles[cardIndex].potential_match
          this.state.profiles[cardIndex].first_name, //match name
          this.state.profiles[cardIndex].about, //match about
          this.state.profiles[cardIndex].images, //match images
          //add 
          this.state.profiles[cardIndex].birthday, //match age
          this.state.profiles[cardIndex].gender, //match gender
          this.state.profiles[cardIndex].city_state, //match city
          this.state.profiles[cardIndex].education,  // match job
          this.state.profiles[cardIndex].work  // match work


        ),this.setState({ cardIndex: cardIndex+1});//update card index in state, so that image modal has correct images 
  };

  //function to load new batch of matches from getMatches service at the new batch time (12) 
  newBatch = (userid) => {
    
    //save context of this
    var _this = this;
    
    //calculate miliseconds until batch time, then update swipe count to 0. 
    var now = new Date();
    var millisTillBatch = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0) - now;
    if (millisTillBatch < 0) {
         millisTillBatch += 86400000; // it's after 10am, try 10am tomorrow.
    }

    //set up setTimeout function
    this.timer = setTimeout(() => {

      //save ref, in order to update swipe count to 0
      let userRef = firebase.database().ref('users/'+userid+'/');

      //update swipe count in db in order to compute remaining matches. 
      userRef.update({ 
          swipe_count: 0,
          last_swipe_sesh_date: new Date().getTime()
      }).then(function(){
        _this.getMatches(userid);
      }).catch(function(error) {
        console.log("Data could not be saved." + error);
      });
    }, millisTillBatch);
  }

  enableNavigation = (view) => {
    const { navigate } = this.props.navigation;

    //save flag that user has now seen their daily match.
    let userRef = firebase.database().ref('users/'+this.state.userId+'/');

    console.log('swipecountstart is: '+this.state.swipeCountStart + 'card index is: '+ this.state.cardIndex);
    //update swipe count in db in order to compute remaining matches. 
    userRef.update({
      swipe_count: this.state.swipeCountStart + this.state.cardIndex,
      last_swipe_sesh_date: new Date().getTime()
    });

    //navigate to appropriate view;
    if (view == 'Settings'){
      navigate("Settings");
    }else{
      navigate("Messages");
    }
    
  }




  render () {
    const { navigate } = this.props.navigation;
    const dimensions = Dimensions.get('window');
    const height = dimensions.height;
    const width = dimensions.width

    //determine width of device in order for custom margin between iphones
    let deviceWidth = Dimensions.get('window').width

    //if device width is 414 (iphone+), then margins should be 58, else 40. 
    let loadingLeftPosition = deviceWidth == 414 ? 185 : 173;     
    
    failImage = 'https://image.nj.com/home/njo-media/width620/img/entertainment_impact/photo/lil-bub-catsbury-park-cat-convention-asbury-park-2018jpg-42ba0699ef9f22e0.jpg';
    let cardIndex = this.state.cardIndex;
 
    // //if profile are fetched
    // if (this.state.isEmpty) {
    //   isEmpty = 
    //     <Text style={{padding: 15,backgroundColor:'white', color:'black'}}>
    //       PROFILES ARE EMPTY
    //     </Text>;
    // }


    return (
      <Container style={{ flex: 1 }} >
          <Header>
            <Left>
              <Button transparent onPress={() => this.enableNavigation('Settings') }>
               <FontAwesome style={{fontSize: 32, color: '#B2B2FF'}}>{Icons.cog}</FontAwesome>
              </Button>
            </Left>
            <Body>
              <FontAwesome style={{fontSize: 32, color: '#B2B2FF'}}>{Icons.users}</FontAwesome>
            </Body>
            <Right>
              <Button transparent onPress={() => this.enableNavigation('Messages') }>

               <FontAwesome style={{fontSize: 32, color: '#B2B2FF'}}>{Icons.comments}</FontAwesome>
      
                { this.state.showChatCount && 
                  <Badge style={{ position: 'absolute', left: 25 }}>
                    <Text>{this.state.unreadChatCount}</Text>
                  </Badge>
                }
              </Button>
            </Right>
          </Header>
        <View style={{ marginTop: -50}}>

         <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: width/6, top: height/2}}>
          {(this.state.isEmpty || this.state.allSwiped) && 
            <View>
              <Text> Come back tomorrow for more matches.</Text>
              <Text>Please help us grow by sharing with friends</Text>
              <View style ={{marginTop: 20}}>
                <Button onPress={this.onShare} rounded block bordered>
                  <Text>Invite friend</Text>
                </Button>
              </View>
            </View>}
        </View>

        <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: loadingLeftPosition, top: height/2}}>
            <ActivityIndicator animating={this.state.loading} size="large" color="#0000ff" />
         </View>
        
          <Swiper
            ref={swiper => {
              this.swiper = swiper
            }}
            verticalSwipe = {false}
            onTapCard={() => this.setState({ imageViewerVisible: true, matchAbout: this.state.profiles[cardIndex].about, matchEducation: this.state.profiles[cardIndex].education, matchBirthday: this.state.profiles[cardIndex].birthday, matchWork: this.state.profiles[cardIndex].work, matchGender: this.state.profiles[cardIndex].gender, matchCityState: this.state.profiles[cardIndex].city_state, matchEducation: this.state.profiles[cardIndex].education,  matchImages: Object.values(this.state.profiles[cardIndex].images) })} 
            cardIndex={this.state.cardIndex}
            backgroundColor={'#4FD0E9'}
            stackSeparation={12}
            stackSize={10}
            onSwiped={(index) => console.log('onSwiped at index: '+index)}
            //onSwipedAll={(index) => this.getMatches(this.state.userId)} 
            onSwipedAll={(index) => this.setState({ swipesStatsShow: true, allSwiped: true })}
            cards={this.state.profiles}
            onSwipedRight={(index) => this.onSwiped(index,'right',true)}//this.state.profile[]cardIndex.potential_match 
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

                      <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',                        
                      }}>
                        <ImageBackground
                          resizeMode="cover"
                          style={{ width: '100%', height: height-230 }}
                          source={{uri: Object.values(item.images)[0].url}}
                        />
                      </View>

                     </CardItem>
                    <CardItem>
                      <Left>
                        <Body>
                          <Text style={{fontWeight: "bold"}} >{this.calculateAge(item.birthday)}, {item.gender}, {item.city_state}</Text>
                          <Text>{item.education} </Text>
                          <Text style={{marginBottom: 4}} note>{item.work} </Text>
                          <Text numberOfLines={1} note>{item.about} </Text>
                        </Body>
                      </Left>
                    </CardItem>
                  </Card>
                )
            }}>
          </Swiper>


        </View>










          <Modal 
            visible={this.state.imageViewerVisible} 
            transparent={true}
            animationType="slide">

              <ImageViewer 
                index = {this.state.imageIndex}
                imageUrls={this.state.matchImages}
                onChange = {(index) => this.setState({ imageIndex: index})}
                onSwipeDown = {() => this.setState({ imageViewerVisible: false, imageIndex: 0, profileMaxHeight: '15%'})}
                onClick = {() => this.setState({ imageViewerVisible: false, imageIndex: 0,  profileMaxHeight: '15%'})}
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

                          <Text style={{fontWeight: "bold"}} >{this.calculateAge(this.state.matchBirthday)}, {this.state.matchGender}, {this.state.matchCityState}</Text>
                          <Text style={{marginBottom: 4}} note>{this.state.matchWork} </Text>
                          <Text style={{marginBottom: 4}} note>{this.state.matchEducation} </Text>
                          <Text numberOfLines={2} note>{this.state.matchAbout} </Text>

                        </View>
                      </TouchableOpacity>
                  </ScrollView>
                </View>          
          </Modal> 

      </Container>
    )
  }
}

export default Swipes;
