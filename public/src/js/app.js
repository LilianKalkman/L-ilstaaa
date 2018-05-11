var buttonsPermissionNotifications = document.querySelectorAll('.enable-notifications');

var deferredPrompt;

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification(){
  const options = {
    body: 'Let the stalking begin',
    icon: 'https://d30y9cdsu7xlg0.cloudfront.net/png/154626-200.png',
    image: 'https://d30y9cdsu7xlg0.cloudfront.net/png/154626-200.png',
    vibrate: [100, 50, 200],
    badge: '/src/images/icons/app-icon-96x96.png',
    tag: 'confirm-notification',
    renotify: true,
    actions: [
      {action: 'confirm', title: 'Ok', icon: 'https://image.freepik.com/iconen-gratis/duim-omhoog-te-vinden-op-facebook_318-37196.jpg'},
      {action: 'cancel', title: 'Ok Doei', icon: 'https://image.freepik.com/iconen-gratis/duim-omhoog-te-vinden-op-facebook_318-37196.jpg'}
    ]
  };
  if('serviceWorker' in navigator){
    navigator.serviceWorker.ready.then(function(sw){
      sw.showNotification('Confirmed Notifications, lekker bezig!', options);
    })
  } else {
    new Notification('Confirmed Notifications, lekker bezig!', options);
  }
}

// de tag option geeft een id/name/ref naar je notification, en je renotify optie bepaalt op je bij een zelfde notificatie
// (met zelfde naam/tag) je telefoon weer vibreert en notificatie laat zien of niet.

let swreg;
function createSubscription(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.ready
    .then(function(sw){
      swreg = sw;
      return sw.pushManager.getSubscription();
      // gets subscription for THIS browser ON this device.
    })
    .then(function(sub){
      if(sub === null){
        // get vapid key with help of web-push package
        const vapidPublicKey = 'BDyfedOXAr6Z-aKtV0Xt7jbKh0qIJ9Z8ko8A51H0bXQ4NjKh-M6Rg8i1aueRMSGyU29JKNAgSkLsqUIFt85QVxQ';
        // convert key to right value with help of helper function from utility.js
        const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
        // pass this to subscription

        // create new subscription
        // add object to add security; key that allows only one server to send push notifications.
        return swreg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        });
      } else {
        // we have a subscription already
      }
    })
    .then(function(newSubscription){
      // send subscription to your backend so it knows the endpoint URL of push server
      return fetch('https://l-ilstagram.firebaseio.com/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'Accept':'application/json'
        },
        body: JSON.stringify(newSubscription)
      })
    })
    .then(function(response){
      if(response.ok){
        displayConfirmNotification();
      }
    })
    .catch(function(err){
      console.log(err);
    })
  } else {
    return;
  }
}

// store public vapid key here and store private vapid key in serviceWorker
// push browser server will match these and make sure only that/your server can access/write it.

function askPermission(){
  Notification.requestPermission(function(result){
    if(result !== 'granted'){
      console.log('No permission for notifications from user');
    } else {
      console.log('permission given to send notifications');
      // displayConfirmNotification();
      createSubscription();
      // set display buttons back to none
    }
  })
}

if('Notification' in window){
  for(var i = 0; i < buttonsPermissionNotifications.length; i++){
    buttonsPermissionNotifications[i].style.display = 'inline-block';
    buttonsPermissionNotifications[i].addEventListener('click', askPermission);
  }
}
