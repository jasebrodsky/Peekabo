import React, { Component } from 'react';
import { connect } from "react-redux";
import { Image, StyleSheet, ScrollView, FlatList, Slider, TouchableOpacity } from 'react-native';
import DrawBar from "../DrawBar";
import { DrawerNavigator, NavigationActions } from "react-navigation";
import DatePicker from 'react-native-datepicker';
import PhotoUpload from 'react-native-photo-upload';
import ImagePicker from 'react-native-image-crop-picker';
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



class Profile extends Component {

  constructor(props){
    super(props)


  this.state = {
      settings: {
        gender_match: 'female',
        min_age: 35,
        max_age: 23,
        error: null,
        notifications_message: true,
        notifications_match: true
      },
      profile: {
        name: 'jason brodsky',
        latitude: null,
        longitude: null,
        gender: 'male',
        birthday: null,
        images: [
          {
            src: require('./img/swiper-1.png'), 
            id: '1'
          },
          {
            src: require('./img/swiper-2.png'), 
            id: '2'
          },
          {
            src: require('./img/swiper-3.png'),
            id: '3'
          },
          {
            src: require('./img/swiper-4.png'),
            id: '4'
          }
        ],      
      }
    }

    console.log(this.state);

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

  componentDidMount() {
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.setState({ 
          profile: { ...this.state.profile, error: null},
          profile: { ...this.state.profile, latitude: position.coords.latitude},
          profile: { ...this.state.profile, longitude: position.coords.longitude}, //some reason only loads last item??

        });
      },
      (error) => this.setState({ 
          profile: { ...this.state.profile, error: null},
        }),

      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000, distanceFilter: 10 },
    );
  }

  componentWillUnmount() {
    navigator.geolocation.clearWatch(this.watchId);
  }

  onPressHandle1 = () => {
     this.setState({ 
      settings: { ...this.state.settings, notifications_message: !this.state.settings.notifications_message}
    }); 
     console.log(this.state);
  }

  onPressHandle2 = () => {
    this.setState({
      settings: { ...this.state.settings, notifications_match: !this.state.settings.notifications_match}
    }); 
     console.log(this.state);
  }


  pickMultiple() {
    ImagePicker.openPicker({
      multiple: true,
      waitAnimationEnd: false,
      includeExif: true,
    }).then(images => {
      this.setState({ 
        profile: { ...this.state.profile, images: images.map(i => {
          return {uri: i.path, width: i.width, height: i.height, mime: i.mime};
          })
        }
      });
    }).catch(e => alert(e));
  }

  scaledHeight(oldW, oldH, newW) {
    return (oldH / oldW) * newW;
  }

  renderImage(image) {
    return <Image style={{width: 100, height: 100, marginLeft:10 }} source={image} />
  }



  renderAsset(image) {
    if (image.mime && image.mime.toLowerCase().indexOf('video/') !== -1) {
      return this.renderVideo(image);
    }

    return this.renderImage(image);
  }





  render() {

    const { navigate } = this.props.navigation;
    return (
      <Container>
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
            placeholder="select date"
            format="YYYY-MM-DD"
            minDate="1920-01-01"
            maxDate="2016-06-01"
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
              // ... You can check the source to find the other keys. 
            }}
            onDateChange={(date) => this.setState({
              profile: { ...this.state.profile, birthday: date}
            })
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
                  value={this.state.profile.name}
                  onChangeText = {(value) => this.setState({
                    profile: { ...this.state.profile, name: value}
                  })
                }
                />
              </Item>
              <Item fixedLabel >
                <Label>Location</Label>
                <View style={{ flexGrow: 1, justifyContent: 'center' }}>
                  <Text>Lat: {this.state.profile.latitude} </Text>
                  <Text>Long: {this.state.profile.longitude}</Text>
                  {this.state.settings.error ? <Text>Error: {this.state.settings.error}</Text> : null}
                </View>
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
                              });
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
                  placeholder = 'Select a date'
                  onChangeText = {(value) =>this.setState({
                    profile: { ...this.state.profile, birthday: value}
                  })}
                  />
              </Item>
              <Item fixedLabel>
                <Text>My photos ...</Text>
                <Input />
              </Item>


              <CardItem>
                <Body>

                    <ScrollView horizontal>
                      <Button onPress={this.pickMultiple.bind(this)} light style={{ borderRadius: 100, borderWidth: 0.6, borderColor: '#d6d7da',width: 100, height: 100, marginLeft:10, justifyContent: 'center', alignItems: 'center' }}>
                        <Icon  name="ios-add-circle-outline" />
                      </Button>
                      {this.state.profile.images ? this.state.profile.images.map((i, n) => <View key={n}>{this.renderAsset(i)}</View>) : null}
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
                                settings: { ...this.state.settings, gender_match: GENDER_MATCH_OPTIONS[buttonIndex]}
                              }) ;
                            }
                        }
                      )
                    } 
                  >
                <Label>Gender</Label>
                <Input disabled value={this.state.settings.gender_match} />
              </Item>
              <Item fixedLabel>
                <Label>Min Age</Label>
                  <Slider
                   style={{ width: 200, right:40 }}
                   step={1}
                   value={this.state.settings.min_age}
                   minimumValue={18}
                   maximumValue={70}
                   onValueChange={val => this.setState({
                    settings: { ...this.state.settings, min_age: val}
                  })}
                  />
                <Text style={{ right:20}}>
                    {this.state.settings.min_age}
                </Text>
              </Item>
              <Item fixedLabel>
                <Label>Max Age</Label>
                  <Slider
                   style={{ width: 200, right:40 }}
                   step={1}
                   minimumValue={18}
                   maximumValue={55}
                   value={this.state.settings.max_age}
                   onValueChange={val => this.setState({
                    settings: { ...this.state.settings, max_age: val}
                  })}                  />
                <Text style={{ right:20}}>
                    {this.state.settings.max_age}
                </Text>
              </Item>
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>Notify me when...</Text>
              </ListItem>
              <ListItem>
                <Text>New message</Text>
                <Right>
                  <Radio 
                    selected={this.state.settings.notifications_message} 
                    onPress={this.onPressHandle1}
                    />
                </Right>
              </ListItem>
              <ListItem>
                <Text>New match</Text>
                <Right>
                  <Radio 
                    selected={this.state.settings.notifications_match}
                    onPress={this.onPressHandle2}
                  />
                </Right>
              </ListItem>
              <ListItem itemDivider style={{flexDirection: "row", justifyContent: "flex-start"}}>
                <Text>Contact us about...</Text>
              </ListItem>
              <Item fixedLabel >
                <Label>Help/Support</Label>
                <Input />
              </Item>
              <Item fixedLabel >
                <Label>Rate Us</Label>
                <Input />
              </Item>
              <Item fixedLabel >
                <Label>Privacy Policy</Label>
                <Input />
              </Item>
              <Item fixedLabel >
                <Label>Terms</Label>
                <Input />
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



