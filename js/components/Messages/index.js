import React, { Component } from 'react';
import {Dimensions, ActivityIndicator, ScrollView, ListView } from 'react-native';
import RNfirebase from 'react-native-firebase';
import * as firebase from "firebase";
import { DrawerNavigator, NavigationActions } from "react-navigation";
import FontAwesome, { Icons } from 'react-native-fontawesome';
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
  Separator,
  Body,
  View
} from "native-base";

import ProgressCircle from 'react-native-progress-circle';


class Messages extends Component {

  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      convoData: [],
      currentDate: new Date(),
      loading: true,
      isEmpty: false,
      expiredMatches: false
    }

  }


  //RE FORMATE IMAGES NOW THAT IT'S AN OBJECT (NOT AN ARRAY)

  //render each ListItem element
  //figure out how to locate the properties of the 'x' object passed in the function below. Looks like those properties are null for some reason 
  convoRender(x, i, type){
    const { navigate } = this.props.navigation; //needed for navigation functions
    let object = x.toJSON(); //convert to JSON
    let blur = Number(object.blur);
    let url = Object.values(object.images)[0].url;
    let images = object.images;
    let name = object.name;
    let about = object.about;
    let birthday = object.birthday;
    let gender = object.gender;
    let city_state = object.city_state;
    let education = object.education;
    let work = object.work;
    let match_date = object.match_date;
    let last_message = object.last_message;
    let last_message_date = object.last_message_date;
    let timeRemaining =  86000000 - (this.state.currentDate.getTime() - match_date);
    let percent_left = (timeRemaining/86000000)*100;
    let match_state = (timeRemaining > 0) ? 'active' : 'expired';
    let match_id = object.match_id;
    let unread_message = object.unread_message;
    let bold = (unread_message == true) ? '900' : 'normal';
    let match_userid = object.match_userid;
    let expiredMatches = false;
    
    if (type == 'active' && match_state == 'active'){
      
      return(
        <ListItem key={i} onPress={() => navigate("Chat", {match_id: match_id, match_state: match_state, match_userid: match_userid, about: about, name: name, birthday: birthday, gender: gender, city_state: city_state, education: education, work: work, images:images, blurRadius: blur })}>        
          <ProgressCircle
              matchStatus = {match_state}
              blur={blur}
              percent={percent_left}
              radius={35}
              borderWidth={5}
              color = {percent_left>50 ? '#3399FF' : percent_left>20 ? 'orange' : 'red'}
              shadowColor="#999"
              bgColor="#fff"
          >
              <Thumbnail blurRadius={blur} round size={80} source={{uri: url, cache: 'force-cache'}} />
            </ProgressCircle>
          <Body>
            <Text>{name}</Text>
            <Text note numberOfLines={1} style={{fontWeight: bold}}>
              {last_message}
            </Text>
          </Body>
        </ListItem>
        )
    }else if (type == 'expired' && match_state == 'expired'){
      
      return(
        <ListItem key={i} onPress={() => navigate("Chat", {match_id: match_id, match_state: match_state, match_userid: match_userid, about: about, name: name, images:images, blurRadius: blur })}>        
          <ProgressCircle
              blur={blur}
              matchStatus = {match_state}
              percent={percent_left}
              radius={35}
              borderWidth={5}
              color = {percent_left>50 ? '#3399FF' : percent_left>20 ? 'orange' : 'red'}
              shadowColor="#999"
              bgColor="#fff"
          >
              <Thumbnail blurRadius={blur} round size={80} source={{uri: url}} />
            </ProgressCircle>
          <Body>
            <Text>{name}</Text>
            <Text note numberOfLines={1} style={{fontWeight: bold}}>
              {last_message}
            </Text>
          </Body>
        </ListItem>
        )
    }

  }
  

  componentWillMount() {
    const { state, navigate } = this.props.navigation;
    let Analytics = RNfirebase.analytics();
    userId = firebase.auth().currentUser.uid;
    firebaseRef = firebase.database().ref('/matches/'+userId+'/').orderByChild('last_message_date').limitToFirst(50);

      var convos = [];
      //put message data into state in appropriate format
      firebaseRef.once('value')
       .then((matchSnap) => {

          //push match objects into convos array. If match is removed, don't add to arrary. 
          matchSnap.forEach((item) => {
            
            //save variables to use in forEach loop
            let matchDate = item.toJSON().match_date;
            let timeRemaining =  86000000 - (this.state.currentDate.getTime() - matchDate);
            let matchState = (timeRemaining > 0) ? 'active' : 'expired';
            let matchRemoved = item.toJSON().removed;
            let matchStatus = item.toJSON().status;
            

            //remove matches that have been removed by match
            if((matchRemoved !== true) && matchStatus !== 'paused'){
               convos.push(item);
            }

            //set flag expiredMatches so that render function can show the expired matches seperator. 
            if (matchState == 'expired' && this.state.expiredMatches == false){  
              this.setState({
                expiredMatches: true
              });

            }
          })

          //check if matchSnap is empty, if so show empty state else render matche
          if(convos === undefined || convos.length == 0 ){

            //put convos array into state and turn off loading
            this.setState({
              convoData: [],
              loading: false,
              isEmpty: true
            });

          }else{

            //put convos array into state and turn off loading
            this.setState({
              convoData: convos,
              loading: false,
              current_conversations_count: convos.length
              }
            ),

              //run analytics
              Analytics.setAnalyticsCollectionEnabled(true);
              Analytics.setCurrentScreen('Messages', 'Messages');
              Analytics.setUserId(userId);

              //firebase ref to user obj
              firebaseProfileRef = firebase.database().ref('/users/' + userId);

              //update db with current_conversations_count, as the last_conversation_count, so that user won't see a notificaiotn until they have unseen match. 
              firebaseProfileRef.update({last_conversation_count: convos.length});


              //RESET current_conversations_count TO 0
              //firebaseProfileRef.update({unread_conversation_count: 0});
           

          }
      
          //console.log('StateConvos are: '+JSON.stringify(this.state.convoData));
       });
  }

  render() {
    const { navigate } = this.props.navigation; //needed for navigation functions, should combine with same const in the render function. 
    const dimensions = Dimensions.get('window');
    const height = dimensions.height;
    const width = dimensions.width

    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={() => navigate("Swipes")}>
              <FontAwesome style={{fontSize: 32, color: '#B2B2FF'}}>{Icons.users}</FontAwesome>
            </Button>
          </Left>
          <Body>
            <FontAwesome style={{fontSize: 32, color: '#B2B2FF'}}>{Icons.comments}</FontAwesome>
          </Body>
          <Right>
          </Right>
        </Header>
        <View>
          <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: width/4, top: height/2}}>
            {this.state.isEmpty && <Text> Sorry no messages yet :( </Text>}
          </View>
          <View style={{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: width/2, top: height/2}}>
            <ActivityIndicator animating={this.state.loading} size="large" color="#0000ff" />
          </View>
        </View>
        <Container>

          <ScrollView style={{  flex: 1, padding: 0 }}>
            <List>
              {
                this.state.convoData.map((n, i) => {
                    return this.convoRender(n, i, 'active');
                })
              }
              {this.state.expiredMatches &&
                <Separator bordered>
                  <Text>Expired</Text>
                </Separator>
              }
              {
                this.state.convoData.map((n, i) => {
                    return this.convoRender(n, i, 'expired');
                })
              }
            </List>     
          </ScrollView>
        </Container>
      </Container>

    );
  }
}

export default Messages;
