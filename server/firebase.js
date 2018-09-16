var firebase = require("firebase");

//Init all firebase
var config = {
  apiKey: "AIzaSyDzPpDgjg7yeJi8MP165IJVcDKEHOe_Tn8",
  authDomain: "htnonlineversity.firebaseapp.com",
  databaseURL: "https://htnonlineversity.firebaseio.com",
  storageBucket: "htnonlineversity.appspot.com",
  messagingSenderId: "6129973572"
};
firebase.initializeApp(config);

  // Get a reference to the realtime database service
  var db = firebase.database();
  var user = {};

  exports.createUser = function(userObj, res) {
    user = userObj;

    firebase.auth().createUserWithEmailAndPassword(user.email, user.password).then(function(data){
      console.log(data);

      delete user.password;
      db.ref('users/' + data.user.uid).set(user);

      //redirect to home
      res.redirect('/home');
    }).catch(function(error) {
      res.send( error);
    });

    
  }

  exports.signIn = function(email, password, res){
    res.setHeader('Content-Type', 'text/plain')
    firebase.auth().signInWithEmailAndPassword(email, password).then(function(data){
        res.send();
    }).catch(function(error) {
      res.status(401).send();
    });

  }

  exports.signOut = function(){
    firebase.auth().signOut().then(function() {
      console.log("Sign-out successful.");
    }).catch(function(error) {
      console.log("Sign-out failed.");
    });
  }

  exports.getUser = function(res){
    var userAuth = firebase.auth().currentUser;
    if(!userAuth) {
      res.send(false);
      return;
    }
    db.ref('/users/' +userAuth.uid).once('value').then(function(snapshot) {
      user = snapshot.val();
      user.uid = userAuth.uid;
      res.send(user);
    });
  }

  function addSchoolCourse(school, course){
    db.ref('/school/' + school).push({
      course : true
    })
  }

  function addPersonalCourse(school, course){
    if(school != user.school) {
      console.log( "This course is not from your school");
      return false;
    }

    var callback = function(courseObj){
      console.log("course obj:", courseObj);
      if(courseObj){
        db.ref('/users/' + user.uid + "/courses/" + course).set(true);
      }
      else console.log("This course does not exist");
    }

    db.ref('/school/' + school + "/" + course).once('value').then(function(snapshot) {
      callback(snapshot.val());
    });

  }

  function createRoom(room, course, callback){
    var roomsRef = db.ref('rooms/' + course);

    roomsRef.on('child_added', function(data) {
        console.log(data, data.val());
        roomsRef.off();
        callback(data.key);
    });
    roomsRef.push(room);   
}

function leaveRoom(roomID, course){
    var roomRef = db.ref('rooms/'+course+'/'+roomID);
    roomRef.once('value').then(function(snapshot) {
        var room = snapshot.val();
        console.log(room);
        if(room.memberCount == 1) roomRef.remove();
        else {
            room.memberCount--;
            roomRef.update(room);
        }
    });
}

function joinRoom(roomID, course){
    var roomRef = db.ref('rooms/'+course+'/'+roomID);
    roomRef.once('value').then(function(snapshot) {
        var room = snapshot.val();
        if(!room) {
            console.log("error!!! no room");
        } else {
            console.log(room);
            room.memberCount++;
            roomRef.update(room);
        }
        
    });
}

