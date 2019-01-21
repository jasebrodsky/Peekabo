// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();



// WRITE CLOUD FUNCTION THAT UPDATES PROFILE OBJ (of recieving user) 'unread_conversation_count' by iterating +1 FOR EVERY NEW MESSAGE.
// WILL ALSO SEND NOTIFICATION FROM HERE AS WELL.

// exports.updateNavNotications = functions.database
// .ref('/rooms/{roomId}/messages/{messageId}')
// .onCreate(async (snapshot, context) => {
//     const roomId = context.params.roomId
//     const messageId = context.params.messageId
//     console.log(`New message ${messageId} in room ${roomId}`)

//     const messageData = snapshot.val()
//     const text = addPizzazz(messageData.text)
//     await snapshot.ref.update({ text: text })

//     const countRef = snapshot.ref.parent.parent.child('messageCount')
//     return countRef.transaction(count => {
//         return count + 1
//     })
// })



// add in age range/location (in db and function query start and end strings)

//get matches
exports.getMatches = functions.https.onRequest((req, res) => {
    const userid = req.query.userid;
    let rankedMatches = [];
    let remainingSwipes = 10;

    //save eligibleMatches into const which returns promise -- these will be the users who fit user in context preferences
    const eligibleMatches = admin.database().ref('/users/' + userid).once('value').then(userPrefSnap => {
        
        // save preferences of user to use later in following query
        let latitude = userPrefSnap.val().latitude;
        let longitude = userPrefSnap.val().longitude;
        let max_age = userPrefSnap.val().max_age;
        let min_age = userPrefSnap.val().min_age;
        let swipe_count = userPrefSnap.val().swipe_count;
        let last_swipe_sesh_date = userPrefSnap.val().last_swipe_sesh_date;
        let current_date = new Date();
        let last_batch_date = new Date();

        //compute lastBatchDate, the last timestamp when it was noon 
        //if it's after noon, then set last batch date to today at noon
        if (current_date.getHours()>=21){
          last_batch_date.setDate(current_date.getDate());
          last_batch_date.setHours(21,0,0,0);

        } else{
          //else must be before noon, set last batch day to yesterday at noon
          last_batch_date.setDate(current_date.getDate()-1);
          last_batch_date.setHours(21,0,0,0);
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

          // save gender pref variable       
          let gender_pref = userPrefSnap.val().gender_pref;

          // translate user's gender_pref into who they're interested in. 
          switch (gender_pref) {
            case 'female_straight':
              var query_start = 'male_bi';
              var query_end = 'male_straight';
              //above query will include male_gay since it's inbetween male_bi and male_straight
              break;
            case 'male_straight':
              var query_start = 'female_bi';
              var query_end = 'female_straight';
              break;
            case 'male_gay':
              var query_start = 'male_bi';
              var query_end = 'male_gay';
              break;
            case 'female_gay':
              var query_start = 'female_bi';
              var query_end = 'female_gay';
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

          //return promise of users who are fit users preferences and limited to their remaining swipes
          return admin.database().ref('users').orderByChild('gender_pref').startAt(query_start).endAt(query_end).once('value', (eligibleMatchesSnap) => {
            return eligibleMatchesSnap
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

        //remove deleted profiles by removing objects with prop deleted
        eligibleMatchesSnapArray = eligibleMatchesSnapArray.filter(function( matchObj ) {
          return matchObj.status !== 'deleted';
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






