var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var pickImageArea = document.querySelector('#pick-image');

function initCamera(){
  if(!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {};
  }

  if(!('getUserMedia' in navigator.mediaDevices)){
    // if browser dus not support getUserMedia, we try to get access to older versions here,
    // or make it manually with the function below
    navigator.mediaDevices.getUserMedia = function(constraints){
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if(!getUserMedia){
        return Promise.reject(new Error('getUserMedia is not available'));
      }

      return new Promise(function(resolve, reject){
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }

  navigator.mediaDevices.getUserMedia({video: true})
    .then(function(video){
      // link videostream aan video html element (staat op autoplay dus speelt meteen af)
      videoPlayer.srcObject = video;
      videoPlayer.style.display = 'block';
    })
    .catch(function(err){
      console.log(err);
      pickImageArea.style.display = 'block';
    })
}


function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(function(){
    createPostArea.style.transform = 'translateY(0)';
  },1);
  initCamera();
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
}

function sendData(){
  fetch('https://us-central1-l-ilstagram.cloudfunctions.net/storeInstaData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept':'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: "",
    }),
  })
  .then(function(response){
    console.log('data gepost zonder sw', response);
  })
  .catch(function(err){
    console.log(err);
  })
}

form.addEventListener('submit', function(event) {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function(sw) {
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          image: "https://firebasestorage.googleapis.com/v0/b/l-ilstagram.appspot.com/o/IMG_4363.jpg?alt=media&token=43c957aa-331f-4e79-9b37-c623c1c1a4ef"
        };
        writeData('sync-posts', post)
          .then(function() {
            return sw.sync.register('sync-new-posts');
          })
          .then(function() {
            var snackbarContainer = document.querySelector('#confirmation-toast');
            var data = {message: 'Your Post was saved for syncing!'};
            snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
          .catch(function(err) {
            console.log(err);
          });
      });
  } else {
    sendData();
  }
});

// form.addEventListener('submit', function(event){
//   event.preventDefault();
//   if(titleInput.value.trim() === '' || locationInput.value.trim() === ''){
//     alert('Please enter valid data!');
//     return;
//   }
//   closeCreatePostModal();
//   if('serviceWorker' in navigator && 'SyncManager' in window){
//     navigator.serviceWorker.ready
//     .then(function(sw){
//       var post = {
//         id: new Date().toISOString(),
//         title: titleInput.value,
//         location: locationInput.value
//       };
//       writeData('sync-posts', post)
//       .then(function(){
//         sw.sync.register('sync-new-posts');
//         // registering task in sw
//       })
//       .catch(function(err){
//         console.log(err);
//       })
//     })
//   } else {
//     sendData();
//   }
// });


function closeCreatePostModal() {
  // createPostArea.style.display = 'none';
  createPostArea.style.transform = 'translateY(100vh)';
  videoPlayer.style.display = 'none';
  pickImageArea.style.display = 'none';
  canvasElement.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);
closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

// niet gebruikt, is andere manier van data in cache opslaan (ipv dynamic caching)
// function onSaveButtonClicked(event){
//   console.log('button clicked');
//   if('caches' in window){
//     caches.open('user-requested')
//     .then(function(cache){
//       cache.add('https://httpbin.org/get');
//       cache.add('/src/images/sf-boat.jpg')
//     })
//   }
// }

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.backgroundPosition = 'bottom';
  cardTitle.style.height = '180px';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitleTextElement.style.color = 'white';
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // var cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  // componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function clearCards() {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function updateUI(data){
  clearCards();
  for (var i = 0; i < data.length; i++){
    createCard(data[i]);
  }
}

var url = 'https://l-ilstagram.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log('From web', data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray);
  });

if ('indexedDB' in window) {
  readAllData('posts')
    .then(function(data) {
      if (!networkDataReceived) {
        console.log('From indexdb', data);
        updateUI(data);
      }
    });
}


// in deze (en je gewone js files) heb je wel toegang tot je browser storage (cache en indexedDB),
// dus je kan ze LEZEN, maar je kan niks wijzigen; dat kan alleen in je SW.
// Om in je js files Echte toegang tot sw te krijgen moet je hem dus apart openen,
// zoals in de sync function!
// READ, not WRITE (only when opened handmatig)
// in je SW alleen access tot de lifecycle sw events, en dus niet tot een gewone js event, zoals
// de form submit. Daarom in die gevallen in je js file de SW openen.
