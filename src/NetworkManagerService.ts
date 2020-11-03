import * as dbus from "dbus-native";
import { isArray } from "util";
import { Service, ItemStatusListener } from ".";

export default class NetworkManagerService implements Service {

  private sysbus = dbus.systemBus();
  private nmservice = this.sysbus.getService("org.freedesktop.NetworkManager")
  
  private connectionMap = {};
  private activeConnectionMap = {};
  private deviceMap = {};
  private connectionStateMap = {};
  private connStatusListeners:{[connId:string]:ItemStatusListener[]} = {};
  private activeConnectionPropertyChangeListenerMap = {};

  constructor(){
    this.init();
  }

  init(){
    this.nmservice.getInterface("/org/freedesktop/NetworkManager/Settings", "org.freedesktop.NetworkManager.Settings", (err, settings) => {
        settings.ListConnections((err, settingList) => {
            for(let setting of settingList){
                this.nmservice.getInterface(setting, "org.freedesktop.NetworkManager.Settings.Connection", (err, nmconn) => {
                    nmconn.GetSettings((err, connsettings) => {
                        let connId = mapDbusDict(mapDbusDict(connsettings).connection).id[1][0]; 
                        this.connectionMap[connId] = setting;
                    })
                })
            }
        })
    })

    this.nmservice.getInterface("/org/freedesktop/NetworkManager", "org.freedesktop.DBus.Properties", (err, nmprops) => {
      nmprops.on("PropertiesChanged", (ifname, changed, invalidated) => {
        if(ifname === "org.freedesktop.NetworkManager"){
          let changedProps = mapDbusDict(changed);
          if(changedProps.ActiveConnections){
            this.updateActiveConnections(changedProps.ActiveConnections[1][0])
          }
        }
      })

      nmprops.Get("org.freedesktop.NetworkManager", "ActiveConnections", (err, list) => {
        this.updateActiveConnections(list[1][0]);
      })
    })
  }

  updateActiveConnections(list:string[]){
    let n = 0;
    for(let item of list){
      this.nmservice.getInterface(item, "org.freedesktop.DBus.Properties", (err, connprops) => {
        if(err) return;
        if(!this.activeConnectionPropertyChangeListenerMap[item]){
          n++;
          connprops.Get("org.freedesktop.NetworkManager.Connection.Active", "Id", (err, id) => {
            if(err) {n--;return;}
            this.activeConnectionMap[id[1][0]] = item;
            n--;
            if(n === 0) this.onConnectionStatusChange();
          })
          n++;
          connprops.Get("org.freedesktop.NetworkManager.Connection.Active", "State", (err, state) => {
            if(err){n--;return;}
            this.connectionStateMap[item] = state[1][0];
            n--;
            if(n === 0) this.onConnectionStatusChange();
          })
          connprops.on("PropertiesChanged", this.activeConnectionPropertyChangeListenerMap[item] = (ifname, changed, invalidated) => {
            if(ifname === "org.freedesktop.NetworkManager.Connection.Active"){
              let changedProps = mapDbusDict(changed);
              if(changedProps.State){
                this.connectionStateMap[item] = changedProps.State[1][0];
                this.onConnectionStatusChange();
              } 
            }
          })
        }
      });
    }
    let connectionsDisappeared = 0;
    for(let item of Object.keys(this.activeConnectionPropertyChangeListenerMap)){
      if(list.indexOf(item) < 0){
        connectionsDisappeared++;
        this.activeConnectionPropertyChangeListenerMap[item] = undefined;
        this.activeConnectionMap[item] = undefined;
      }
    }
    if(connectionsDisappeared) this.onConnectionStatusChange();
  }

  activateConnection(connId:string, devId:string){
    this.nmservice.getInterface("/org/freedesktop/NetworkManager", "org.freedesktop.NetworkManager", (err, nm) => {
      nm.ActivateConnection(this.connectionMap[connId]||"/", this.deviceMap[devId]||"/", "/");
    })
  }

  deactivateConnection(connId:string){
    this.nmservice.getInterface("/org/freedesktop/NetworkManager", "org.freedesktop.NetworkManager", (err, nm) => {
      nm.DeactivateConnection(this.activeConnectionMap[connId]||"/");
    })
  }

  private onConnectionStatusChange(){
    for(let o of Object.keys(this.connStatusListeners)){
      for(let l of this.connStatusListeners[o]){
        if(this.activeConnectionMap[o]){
          let status = this.connectionStateMap[this.activeConnectionMap[o]];
            l({
              0: "down",
              1: "warning",
              2: "up",
              3: "warning",
              4: "down",
            }[status||0])
        }else{
          l("down");
        }
      }
    }
  }

  addStatusListener(type: string, item: string, listener:ItemStatusListener){
    if(type === "connection"){
      this.connStatusListeners[item] = this.connStatusListeners[item] || [];
      this.connStatusListeners[item].push(listener);
    }
  }

  handleEvent(type: string, item: string, event: string){
    if(type === "connection"){
      if(event === "up"){
        this.activateConnection(item, null);
      }else if(event === "down"){
        this.deactivateConnection(item);
      }
    }
  }


}


function mapDbusDict(input){
    if(!isArray(input)) return input;
    let output = {};
    for(let item of input){
        output[item[0]] = item[1]
    }
    return output;
}

