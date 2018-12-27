import React, { Component } from 'react';
import { connect } from "react-redux";
import { Image, ScrollView, ListView } from 'react-native';
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
      convoData: []
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
    let percent_left = Number(object.percent_left);
    let last_message = object.last_message;
    let time_left = Number(object.time_left);
    let match_id = object.match_id;

    return(
      <ListItem key={i} onPress={() => navigate("Chat", {match_id: match_id, name: name, images:images, blurRadius: blur, time_left: time_left })}>        
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
          <Text note>{last_message}</Text>
        </Body>
      </ListItem>
      )
  }
  

  componentWillMount() {
    const { state, navigate } = this.props.navigation;

     userId = firebase.auth().currentUser.uid;
     firebaseRef = firebase.database().ref('/matches/'+userId+'/');


    var convos = [];
    //put message data into state in appropriate format
    firebaseRef.once('value')
      .then((dataSnapshot) => {
        //console.log('conversations are: '+JSON.stringify(dataSnapshot));

        //TRY USING Object.entities(dataSnapshot --> then set state with array of mathces. )
        dataSnapshot.forEach(function(item) {
          convos.push(item);
        })

        //console.log('convos are: '+JSON.stringify(convos));

          this.setState({
            convoData: convos,
          });

          //console.log('StateConvos are: '+JSON.stringify(this.state.convoData));
       });
  }

  render() {
    const { navigate } = this.props.navigation; //needed for navigation functions, should combine with same const in the render function. 
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
