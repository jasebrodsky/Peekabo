import React, { Component } from 'react';
import { connect } from "react-redux";
import {Dimensions, ActivityIndicator, Image, ScrollView, ListView } from 'react-native';
import DrawBar from "../DrawBar";
import * as firebase from "firebase";
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
import { setIndex } from "../../actions/list";
import { openDrawer } from "../../actions/drawer";
import { GiftedChat } from 'react-native-gifted-chat';
import ProgressCircle from 'react-native-progress-circle';


class Messages extends Component {

  constructor(props){
    super(props)

    //set state to convos var
    this.state = {
      convoData: [],
      currentDate: new Date(),
      loading: true,
      isEmpty: false
    }

  }
  static navigationOptions = ({ navigation }) => {
    return {
      title: null,
    }
  };
  static propTypes = {
    name: React.PropTypes.string,
    setIndex: React.PropTypes.func,
    list: React.PropTypes.arrayOf(React.PropTypes.string),
    openDrawer: React.PropTypes.func
  };



  //RE FORMATE IMAGES NOW THAT IT'S AN OBJECT (NOT AN ARRAY)

  //render each ListItem element
  //figure out how to locate the properties of the 'x' object passed in the function below. Looks like those properties are null for some reason 
  convoRender(x, i){
    const { navigate } = this.props.navigation; //needed for navigation functions
    let object = x.toJSON(); //convert to JSON
    let blur = Number(object.blur);
    let url = Object.values(object.images)[0].url;
    let images = object.images;
    let name = object.name;
    let about = object.about;
    let match_date = object.match_date;
    let last_message = object.last_message;
    let last_message_date = object.last_message_date;
    let timeRemaining =  86000000 - (this.state.currentDate.getTime() - match_date);
    let percent_left = (timeRemaining/86000000)*100;
    let match_id = object.match_id;
    let unread_message = object.unread_message;
    let bold = (unread_message == true) ? '900' : 'normal';
    let match_userid = object.match_userid;

    return(
      <ListItem key={i} onPress={() => navigate("Chat", {match_id: match_id, match_userid: match_userid, about: about, name: name, images:images, blurRadius: blur })}>        
        <ProgressCircle
            blur={blur}
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
  

  componentWillMount() {
    const { state, navigate } = this.props.navigation;

     userId = firebase.auth().currentUser.uid;
     firebaseRef = firebase.database().ref('/matches/'+userId+'/').orderByChild('last_message_date');

      var convos = [];
      //put message data into state in appropriate format
      firebaseRef.once('value')
       .then((matchSnap) => {

          //push match objects into convos array. If match is removed, don't add to arrary. 
          matchSnap.forEach((item) => {
            if(item.toJSON().removed !== true){
               convos.push(item);
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
            );

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
              <Icon name="ios-flame-outline" />
            </Button>
          </Left>
          <Body>
            <Icon name="ios-chatboxes-outline" />
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
                    return this.convoRender(n, i);
                })
              }
            </List>     
          </ScrollView>
        </Container>
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

const MessagesSwagger = connect(mapStateToProps, bindAction)(Messages);
const DrawNav = DrawerNavigator(
  {
    Home: { screen: MessagesSwagger }
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
