// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();


//get referral codes
exports.getCode = functions.https.onRequest((req, res) => {
    const userid = req.query.userid;
    console.log('userid is: '+userid);
    let number = '';

    //query for last code in db 
    admin.database().ref('/codes').limitToLast(1).once('value').then(codeSnap => {
        
        //convert codeSnap into it's data 
        let codeObj = Object.values(codeSnap.toJSON());
        //let codeId = Object.keys(codeSnap.toJSON())[0];
        number = codeObj[0].number;
        let newNumber = number+1;

        var words = ['CHOSEN','RESPECT','LOVE','CONNECT']
        var word = words[Math.floor(Math.random()*words.length)];

        //create newCode object
        var newCode = {
          //code_id: codeId,
          created: new Date(),
          created_by: userid,
          expired: false,
          number: newNumber,
          redeemed_by: false,
          sharable_code: word+"@"+newNumber

        };

        //push newCode into database
        admin.database().ref('/codes').push(newCode).then(newCodeSnap => {
          console.log('newCodeSnap.key is: '+newCodeSnap.key);
          newCode.code_id = newCodeSnap.key;
          return res.status(200).send(newCode);
        })
        .catch(error => console.log(error));
    })  
  })


//function to send notification when message is recieved. 
exports.notifyNewMessage = functions.database.ref('/conversations/{conversationId}/messages/{messageId}').onCreate((snap, context) => {
  
  console.log('trigged message notification');


  //save data of message
  const message = snap.val();
  const senderName = message.user._name;
  const toId = message['userTo'];
  const fromId = message.user._id;
  const messageTxt = message ['text'];

  //fetch fcmToken of reciepient in order to send push notification
  return admin.database().ref('/users/' + toId ).once('value').then((snapUser) => {
    //build media messages notification
    const sendNotificationMessage = snapUser.val().notifications_message;
    const registrationTokens = snapUser.val().fcmToken;

    console.log('registrationTokens is: '+registrationTokens);
    console.log('sendNotificationMessage is: '+sendNotificationMessage);

    //build media messages notification
    const payload = {
        notification: {
          title: senderName + " sent you a message",
          body: messageTxt
        },
        data: {
          // SENDER_NAME: senderName,
          // SENDER_ID: fromId,
          VIEW: 'messages'

        }//end data
    }//end payload

    //send message if user allows notifications for messages
    if (sendNotificationMessage == true) {
      return admin.messaging().sendToDevice(registrationTokens, payload).then( response => {
        const stillRegisteredTokens = registrationTokens;

        response.results.forEach((result, index) => {
          const error = result.error
          if (error) {
              const failedRegistrationToken = registrationTokens[index]
              console.error('blah', failedRegistrationToken, error)
              if (error.code === 'messaging/invalid-registration-token'
                  || error.code === 'messaging/registration-token-not-registered') {
                      const failedIndex = stillRegisteredTokens.indexOf(failedRegistrationToken)
                      if (failedIndex > -1) {
                          stillRegisteredTokens.splice(failedIndex, 1)
                      }
                  }
            }
          })//end forEach

          return admin.database().ref("users/" + toId).update({
              fcmToken: stillRegisteredTokens
          })//end update

      })//end sendToDevice
    }

  })//end return-then
});


//function to send notification when new match is recieved. 
exports.notifyNewMatch = functions.database.ref('/matches/{reciepientId}/{newMatchId}').onCreate((snap, context) => {
  
  //save data of match
  const match = snap.val();
  const matchName = match.name;
  console.log('matchName is: '+matchName);
  const toId = context.params.reciepientId;
  console.log('reciepientId is: '+toId);
  const messageTxt = 'You matched with '+matchName;

  //fetch fcmToken of reciepient in order to send push notification
  return admin.database().ref('/users/' + toId ).once('value').then((snapUser) => {
    //build media messages notification
    const sendNotificationMatch = snapUser.val().notifications_match;
    const registrationTokens = snapUser.val().fcmToken;

    console.log('registrationTokens is: '+registrationTokens);
    console.log('sendNotificationMatch is: '+sendNotificationMatch);

    //build media match notification
    const payload = {
        notification: {
          body: messageTxt
        },
        data: {
          // SENDER_NAME: senderName,
          // SENDER_ID: fromId,
          VIEW: 'messages'

        }//end data
    }//end payload

    //send message if user allows notifications for matches
    if (sendNotificationMatch == true) {
      return admin.messaging().sendToDevice(registrationTokens, payload).then( response => {
        const stillRegisteredTokens = registrationTokens;

        response.results.forEach((result, index) => {
          const error = result.error
          if (error) {
              const failedRegistrationToken = registrationTokens[index]
              console.error('blah', failedRegistrationToken, error)
              if (error.code === 'messaging/invalid-registration-token'
                  || error.code === 'messaging/registration-token-not-registered') {
                      const failedIndex = stillRegisteredTokens.indexOf(failedRegistrationToken)
                      if (failedIndex > -1) {
                          stillRegisteredTokens.splice(failedIndex, 1)
                      }
                  }
            }
          })//end forEach

          return admin.database().ref("users/" + toId).update({
              fcmToken: stillRegisteredTokens
          })//end update
      })//end sendToDevice

    }
  })//end return-then
});


// add in age range/location (in db and function query start and end strings)

//get matches
exports.getMatches = functions.https.onRequest((req, res) => {
    const userid = req.query.userid;
    let rankedMatches = [];
    let remainingSwipes = 10;
    let max_age = 50;
    let min_age = 18;
    let gender_pref = '';
    let latitude = '';
    let longitude = '';
    let max_distance = 100;

    //save eligibleMatches into const which returns promise -- these will be the users who fit user in context preferences
    const eligibleMatches = admin.database().ref('/users/' + userid).once('value').then(userPrefSnap => {
        
        // save preferences of user to use later in following query
        latitude = userPrefSnap.val().latitude;
        longitude = userPrefSnap.val().longitude;
        max_distance = userPrefSnap.val().max_distance;
        max_age = userPrefSnap.val().max_age == 50 ? 100 : userPrefSnap.val().max_age;
        min_age = userPrefSnap.val().min_age;
        let swipe_count = userPrefSnap.val().swipe_count;
        let last_swipe_sesh_date = userPrefSnap.val().last_swipe_sesh_date;
        let current_date = new Date();
        let last_batch_date = new Date();

        //compute lastBatchDate, the last timestamp when it was noon 
        //if it's after noon, then set last batch date to today at noon
        if (current_date.getHours()>=12){
          last_batch_date.setDate(current_date.getDate());
          last_batch_date.setHours(12,0,0,0);

        } else{
          //else must be before noon, set last batch day to yesterday at noon
          last_batch_date.setDate(current_date.getDate()-1);
          last_batch_date.setHours(12,0,0,0);
        }


        console.log('last_swipe_sesh_date: '+last_swipe_sesh_date);
        console.log('last_batch_date: '+last_batch_date.getTime());
        console.log('current_date: '+current_date.getTime());

        // last swipe sesh date is before nextBatchDate and currentDate is after. 
        // this must mean that user is swiping first time in new batch period, re set swipeCount to 0 and continue. 
        
        //        1547661999148           1547726400000                  1547662263903               1547726400000
        if ((last_swipe_sesh_date < last_batch_date.getTime()) && (current_date.getTime() > last_batch_date.getTime())){
          //save swipe_count = 0
          swipe_count = 0;

          //save ref to user obj in order to reset swipe_count.
          let userRef = admin.database().ref('/users/' + userid);
  
          //update swipe count to 0 since its its a new day. 
          userRef.update({
            swipe_count: 0
          }).catch(reason => {
              console.log(reason);
              res.status(500).send('error: '+reason)
            });          

         }

  
        //convert max and min ages into DOB. Put DOB into gender_pref when logging in. 
        // gender_pref = City_Gender_Pref_DOB
        // query_start = NYC_female_bi_23
        // query_end = NYC_female_straight_32


        // check user used all their swipes by checking if swipeCount is 10 or above
        if (swipe_count >= 10){
          console.log('user should not see matches, swipe_count: '+ swipe_count);
          
          //return null object
          return null;

        }else{
          //else continue generating eligble matches

          //calculate remaining swipes from original 10
          remainingSwipes = 10 - swipe_count; 

          // update gender pref variable       
          gender_pref = userPrefSnap.val().gender_pref;

          // translate user's gender_pref into who they're interested in. 
          switch (true) {
            case (gender_pref == 'female_straight'):
              var query_start = 'male_bi';
              var query_end = 'male_straight';
              //above query will include male_gay since it's inbetween male_bi and male_straight
              break;
            case (gender_pref == 'male_straight'):
              var query_start = 'female_bi';
              var query_end = 'female_straight';
              break;
            case (gender_pref == 'male_gay'):
              var query_start = 'male_bi';
              var query_end = 'male_gay';
              break;
            case (gender_pref == 'female_gay'):
              var query_start = 'female_bi';
              var query_end = 'female_gay';
              break;
            case (gender_pref == 'male_bi'):
              var query_start = 'female_bi';
              var query_end = 'male_straight';
              break;
            case (gender_pref == 'female_bi'):
              var query_start = 'female_bi';
              var query_end = 'male_straight';
              break;
            default:
              console.log('Sorry, we are out of ' + expr + '.');
          }

          //return promise of users who are fit users preferences and limited to their remaining swipes
          return admin.database().ref('users').orderByChild('gender_pref').startAt(query_start).endAt(query_end).once('value', (eligibleMatchesSnap) => {
            return eligibleMatchesSnap
            //if user is BI, append male_gay or female_gay users to eligiblematch array here. 
          })   
        }
     
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save swipesReveivedLeft into const which returns promise -- show these last since these won't be matches
    const swipesReceivedLeft = admin.database().ref('/swipesReceived/' + userid).orderByChild('like').equalTo(false).once('value').then(swipesReceivedLeftSnap => {
      return swipesReceivedLeftSnap
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save swipesReveivedRight into const which returns promise -- show these first since these are potetial matches
    const swipesReceivedRight = admin.database().ref('/swipesReceived/' + userid).orderByChild('like').equalTo(true).once('value').then(function(swipesReceivedRightSnap) {
      return swipesReceivedRightSnap
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save swipesGivenLeft into const which returns promise -- show these last since these won't be matches
    const swipesGivenLeft = admin.database().ref('/swipes/' + userid).orderByChild('like').equalTo(false).once('value').then(function(swipesGivenLeftSnap) {
      return swipesGivenLeftSnap
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save swipesGivenRight into const which returns promise -- show these first since these are potetial matches
    const swipesGivenRight = admin.database().ref('/swipes/' + userid).orderByChild('like').equalTo(true).once('value').then(function(swipesGivenRightSnap) {
      return swipesGivenRightSnap
      }).catch(reason => {
        console.log(reason);
        res.status(500).send('error: '+reason)
      });

    //save all const into promise, so that data manipultion can start after realtime db resolves
    const all_pr = Promise.all([eligibleMatches, swipesReceivedLeft, swipesReceivedRight, swipesGivenLeft, swipesGivenRight]).then(results => {
      //DATA MANIPULATION AFTER PROMISE.ALL RESOLVES

      //create empty arrays for all list of users. If db returns a value, replace array with returned value. 
      let sortedEligibleMatchesArray = [];
      let swipesReceivedLefts = [];
      let swipesReceivedRights = [];
      let swipesGivenLefts = [];
      let swipesGivenRights = [];
      let remove = false;
          
      //save all matches into variables. If empty object create empty array. 
      if (results[1].toJSON() !== null) {
        swipesReceivedLefts = Object.keys(results[1].toJSON());      
      }

      if (results[2].toJSON() !== null) {
        swipesReceivedRights = Object.keys(results[2].toJSON());      
      } 

      if (results[3].toJSON() !== null) {
        swipesGivenLefts = Object.keys(results[3].toJSON());      
      } 

      if (results[4].toJSON() !== null) {
        swipesGivenRights = Object.keys(results[4].toJSON());      
      }

      //save eligible matches and sort by last_login here
      if (results[0] !== null) {

        //Create var for unsorted matchs obj
        let eligibleMatchesSnap = results[0].toJSON();

        //Create empty array for match objects to live, will sort eventually
        let eligibleMatchesSnapArray = [];

        //convert result from firebase into an array.
        Object.keys(eligibleMatchesSnap).forEach(userid => {

          //create var for user data, which will be injected into object           
          let userData = eligibleMatchesSnap[userid];

          // create object with flat userData inside in order to sort easier
          let eligbleMatchObj = userData;
          
          //push eligibleMatchObj to eligbleMatchesSnapArray
          eligibleMatchesSnapArray.push(eligbleMatchObj);
        });

        //remove non 'active' profiles and profiles outside of user prefs by removing those objects
        eligibleMatchesSnapArray = eligibleMatchesSnapArray.filter(( matchObj ) => {
          
          //convert matchObject birthday into age
          let matchObjAge = ((new Date()).getTime() - (new Date(matchObj.birthday).getTime())) / (1000 * 60 * 60 * 24 * 365);
          let genderPrefRemove = '';
          //check if users is bi, if so remove same-sex straight users. 
          if (gender_pref == 'male_bi'){
            genderPrefRemove = 'male_straight';
          }else if (gender_pref == 'female_bi'){
            genderPrefRemove = 'female_straight';
          }else{
            genderPrefRemove = null;
          }

          // number of km per degree = ~111km (111.32 in google maps, but range varies between 110.567km at the equator and 111.699km at the poles)
          // 1km in degree = 1 / 111.32km = 0.0089
          // 1m in degree = 0.0089 / 1000 = 0.0000089
          let coef = max_distance * 0.0000089;

          //max coordiantes is user current lat + distance
          let max_lat = latitude + coef;
          let max_long = longitude + coef / Math.cos(latitude * 0.018);

          //min coordiantes is user current lat + distance
          let min_lat = latitude - coef;
          let min_long = longitude - coef / Math.cos(latitude * 0.018);

          //logging for tests
          console.log('current lat is: '+latitude);
          console.log('current long is: '+longitude);
          console.log('coef is: '+coef);

          console.log('min_lat is: '+min_lat);
          console.log('min_long is: '+min_long);
          console.log('max_lat is: '+max_lat);
          console.log('max_long is: '+max_long);
          console.log('max_age is: '+max_age);

          console.log('matchObj.latitude is: '+matchObj.latitude);
          console.log('matchObj.longitude is: '+matchObj.longitude);

          //return matches after passing requirements
          return matchObj.status == 'active' && //only active profiles
                 matchObj.userid !== userid && //remove users own profile. 
                 matchObj.gender_pref !== genderPrefRemove && //remove same-sex straight profiles, if user is bi. 
                 matchObj.latitude >= min_lat && // greater than min latidude
                 matchObj.latitude <= max_lat && //less than max latidude  
                 matchObj.longitude >= min_long && // greater than min longitude
                 matchObj.longitude <= max_long && //less than max longitude  
                 matchObjAge >= min_age && // greater than min_age
                 matchObjAge <= max_age; //less than max_age
        });

        //sort array by child property lastLogin
        eligibleMatchesSnapArray.sort(function(a,b){return a.last_login - b.last_login});

        //need to convert into array of id's 
        sortedEligibleMatchesArray = eligibleMatchesSnapArray.map(a => a.userid);
      }

      // iterate sortedEligibleMatchesArray in reverse, so that when splicing array we arent' skipping next item due to the index incrementing while list decreasing
      for (index = sortedEligibleMatchesArray.length - 1; index >= 0; --index) {

        //console.log('sortedEligibleMatchesArray[index].status: '+sortedEligibleMatchesArray[index]);

        //save flag for when eligibleMatch is user in context or in swipesRecieved or swipesGivenRights or swipesGivenLefts 
        remove = (sortedEligibleMatchesArray[index] == userid) || swipesReceivedRights.includes(sortedEligibleMatchesArray[index]) || swipesReceivedLefts.includes(sortedEligibleMatchesArray[index]) || swipesGivenLefts.includes(sortedEligibleMatchesArray[index]) || swipesGivenRights.includes(sortedEligibleMatchesArray[index]);

        //if removed = true, remove that element from eligbleMatchList array.
        if (remove) {
          sortedEligibleMatchesArray.splice(index, 1);
        }else{
          //if eligible match is unique, create object and add to rankedMatches array with appropriate properties
          let eligibleMatchObject = {
            [sortedEligibleMatchesArray[index]]: {
              matchType:"eligible_match",
              userId: sortedEligibleMatchesArray[index]
            }
          };

          //add object to rankedMatches
          rankedMatches.push(eligibleMatchObject);
        }
      };


     // iterate swipesReceivedRights in reverse, so that when splicing array we arent' skipping next item due to the index incrementing while list decreasing
      for (index = swipesReceivedRights.length - 1; index >= 0; --index) {

        //save flag for user is active match, since both users swiped right on eachother.  
        remove = swipesGivenRights.includes(swipesReceivedRights[index]);

        //if removed = true, remove that element from swipesReceivedRights array.
        if (remove) {
          swipesReceivedRights.splice(index, 1);
        }else{
        
        // after cleaning swipesRecievedRight, create object with it's data. 
        let potentialMatchObject = {
          [swipesReceivedRights[index]]: {
            matchType:"potential_match",
            userId: swipesReceivedRights[index]
          }
        };

          //add potential match objet to rankedMatch array at the start. 
          rankedMatches.unshift(potentialMatchObject);

        }
      }

      //limit ranked matches to to swipesRemaining
      let rankedMatchesSliced = rankedMatches.slice(0, remainingSwipes);
      
      //return response
      return res.status(200).send(rankedMatchesSliced);
    })
});



      //IMPROVE PEFORAMANCE
      //create new object (user_stats?) in db with all info needed in alg (lastlogin/gender_pref/location/score?). 
      //create db triggered cloud function to update object with computed scores used for ranking. 
      // after login, update 'user_stats' with ranked score (likesGiven/LikesRecieved)

      //cases to cover: 
      // 1. no swipes from either dater
      // 2. dater x and dater y swiped yes -- active match, remove from each others lists
      // 3. dater x and dater y swiped no - no interest, can reappear
      // 4. dater x swipes yes and dater y hasn't swiped -- sort top of dater y's
      // 5. dater x swipes yes and dater y swiped no -- sort to bottom of dater y's

      //results array: 
      // results[0] = eligibleMatches -- (age,location,gender_pref)
      // -----------
      // results[1] = swipesReceivedLeft - sort to bottom
      // results[2] = swipesReceivedRight - sort to top (potential matches)
      // results[3] = swipesGivenLeft -- sort to bottom user disliked already
      // results[4] = swipesGivenRight -- remove, user already liked



