import React, { Component } from 'react';
import { connect } from "react-redux";
import { Image } from 'react-native';
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
  Thumbnail,
  Right,
  Body,
  View
} from "native-base";

const cards = [
  {
    text: 'Card One',
    name: 'One',
    image: require('./img/swiper-1.png'),
  },
  {
    text: 'Card Two',
    name: 'One',
    image: require('./img/swiper-2.png'),
  },
  {
    text: 'Card Three',
    name: 'One',
    image: require('./img/swiper-3.png'),
  },
  {
    text: 'Card Four',
    name: 'One',
    image: require('./img/swiper-4.png'),
  },
  {
    text: 'Card Five',
    name: 'Five',
    image: require('./img/swiper-5.png'),
  }
];


export default class BlankPage2 extends Component {
  static navigationOptions = {
    header: null
  };

  render() {
    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={() => this.props.navigation.goBack()}>
              <Icon name="ios-arrow-back" />
            </Button>
          </Left>

          <Body>
            <Title>Blank page</Title>
          </Body>

          <Right>
            <Button
              transparent
              onPress={() => this.props.navigation.navigate("DrawerOpen")}
            >
              <Icon name="ios-menu" />
            </Button>
          </Right>
        </Header>

        <View style={{  flex: 1, padding: 0 }}>
           <DeckSwiper 
            dataSource={cards}
            renderItem={item =>
              <Card style={{ elevation: 3 }}>
                <CardItem cardBody >
                  <Image style={{ height: 510, flex: 1 }} source={item.image} />
                </CardItem>
              </Card>
            }
          />         
        </View>


      </Container>
    );
  }
}
