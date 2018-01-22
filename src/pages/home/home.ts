import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { CommServiceProvider } from '../../providers/comm-service/comm-service';
import { Diagnostic } from '@ionic-native/diagnostic';
import { ToastController } from 'ionic-angular/components/toast/toast-controller';

// declare var iosrtc;
// declare var apiRTC;
// declare var apiCC;

const STATE_WAIT = "wait";
const STATE_INCALL = "incall";

const LABEL_CALL = "Call";
const LABEL_HANGOUT = "Hangup";

const COLOR_CALL = "#5cb85c";
const COLOR_HANGOUT = "#d9534f";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  distantNumber: any;
  infoLabel: any;
  buttonLabel: any;
  buttonColor: any;
  state: any;
  currentCallId: any;

  private commSvc: any;

  constructor(public navCtrl: NavController,
    public alertCtrl: AlertController,
    public platform: Platform,
    commSvc: CommServiceProvider,
    public events: Events,
    private diagnostic: Diagnostic,
    private toast: ToastController) {
    this.commSvc = commSvc;
    this.platform.ready().then(() => {
      this.checkPermissions().then(data => {
        console.log(data);
      }).catch(error => {
        console.log(error);
      })
    }).catch(error => {
      console.log(error);
    })

  }

  ionViewDidLoad() {


    // this.checkPermissions().then(data => {
    //   console.log('Result: ' + data.result);
    //   if (data.result) {

    this.events.subscribe('incomingCall', evt => {
      this.incomingCallHandler(evt);
    });

    this.events.subscribe('userMediaError', evt => {
      this.userMediaErrorHandler(evt);
    });

    this.events.subscribe('remoteStreamAdded', evt => {
      this.remoteStreamAddedHandler(evt);
      console.log('Remote Media added REMOTE');
    });

    this.events.subscribe('userMediaSuccess', evt => {
      this.userMediaSuccessHandler(evt);
    });

    this.events.subscribe('hangup', evt => {
      this.hangupHandler(evt);
    });

    this.infoLabel = "Registration Ongoing...";
    this.buttonLabel = LABEL_CALL;
    this.buttonColor = COLOR_CALL;
    this.state = STATE_WAIT;
    this.sessionReadyHandler();
    //   } else {
    //     console.log('dont have permissions');
    //     this.toast.create({
    //       message: 'User profile not found!',
    //       duration: 3000
    //     }).present();
    //     this.navCtrl.pop();
    //   }
    // })
  }

  /**
   * Call Action
   */
  pushCall(event) {
    console.log("Push, callState=" + this.state);
    if (this.distantNumber && this.state == STATE_WAIT) {
      //setTimeout(this.refreshVideoView, 4000);
      this.commSvc.webRTCClient.call(this.distantNumber);
    } else if (this.state == STATE_INCALL) {
      this.state = STATE_WAIT;
      this.buttonColor = COLOR_CALL;
      this.buttonLabel = LABEL_CALL;
      this.commSvc.webRTCClient.hangUp();
    }
  }

  sessionReadyHandler() {
    this.commSvc.initialize().then(data => {
      this.infoLabel = "Your local ID : " + this.commSvc.sessionId;
      console.log('Done');
    });
  }


  incomingCallHandler(e) {
    console.log("incomingCallHandler");
    this.state = STATE_INCALL;
    this.buttonColor = COLOR_HANGOUT;
    this.buttonLabel = LABEL_HANGOUT;
    //setTimeout(this.refreshVideoView, 2000);
  }

  hangupHandler(e) {
    console.log("hangupHandler");
    this.state = STATE_WAIT;
    this.buttonColor = COLOR_CALL;
    this.buttonLabel = LABEL_CALL;

    this.removeMediaElements(e.detail.callId);
  }

  userMediaSuccessHandler(e) {
    console.log("userMediaSuccessHandler", e);
    this.commSvc.webRTCClient.addStreamInDiv(
      e.detail.stream,
      e.detail.callType,
      "mini",
      'miniElt-' + e.detail.callId,
      { width: "128px", height: "96px" },
      true
    );
    this.currentCallId = e.detail.callId;
  }

  userMediaErrorHandler(e) {
  }

  remoteStreamAddedHandler(e) {
    console.log("remoteStreamAddedHandler", e);
    this.state = STATE_INCALL;
    this.buttonColor = COLOR_HANGOUT;
    this.buttonLabel = LABEL_HANGOUT;

    this.commSvc.webRTCClient.addStreamInDiv(
      e.detail.stream,
      e.detail.callType,
      "remote",
      'remoteElt-' + e.detail.callId,
      { width: "100%" },
      false
    );
    this.currentCallId = e.detail.callId;
    //setTimeout(this.refreshVideoView, 100);
  }

  removeMediaElements(callId) {
    this.commSvc.webRTCClient.removeElementFromDiv('mini', 'miniElt-' + callId);
    this.commSvc.webRTCClient.removeElementFromDiv('remote', 'remoteElt-' + callId);
  }


  backHome() {
    if (this.state == STATE_INCALL) {
      this.state = STATE_WAIT;
      this.buttonColor = COLOR_CALL;
      this.buttonLabel = LABEL_CALL;
      this.commSvc.webRTCClient.hangUp();
    }
    //apiRTC.disconnect();  
    this.events.unsubscribe('incomingCall');
    this.events.unsubscribe('userMediaError');
    this.events.unsubscribe('remoteStreamAdded');
    this.events.unsubscribe('userMediaSuccess');
    this.events.unsubscribe('hangup');


    this.navCtrl.pop();
  }

  tango() {
    this.checkPermissions().then(data => {
      console.log(data);
    }).catch(error => {
      console.log(error);
    })
  }

  tangoRecived(e) {

    console.log('Tango Recived');
    console.log(e.message);
  }


  checkPermissions(): Promise<any> {
    return new Promise(resolve => {
      // this.diagnostic.isCameraAvailable().then(isCam => {
      //   console.log('isCam: ' + isCam);
      this.diagnostic.requestCameraAuthorization(true).then(isCamAuth => {
        console.log('isCamAuth: ' + isCamAuth)
        return resolve({ result: true });
      }).catch(error => {
        console.log(error);
        return resolve({ result: false });
      })
      // }).catch(error => {
      //   return resolve({ result: false });
      // });
    });
  }

}
