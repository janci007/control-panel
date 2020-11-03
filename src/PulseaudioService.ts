import { Service, SwitchEvent, ItemStatusListener } from ".";
import { execFile } from "child_process";

export default class PulseaudioService implements Service {


  addStatusListener(type: string, item: any, listener: ItemStatusListener) {

  }

  handleEvent(type: string, item: any, event: SwitchEvent) {
    if (type === "profile") {
      this.setDeviceProfile(item.device, item.profile[event]);
    } else if (type === "port") {
      return this.setSourcePort(item.device, item.source, item.port[event])
    }
  }

  setDeviceProfile(deviceId, profileName) {
    execFile("pactl", ["set-card-profile", deviceId, profileName], (error, stdout, stderr) => {
      console.log("pactl exec", error, stderr, stdout)
    });
  }

  setSourcePort(deviceId, sourceId, portId) {
    execFile("pactl", ["set-source-port", deviceId + "." + sourceId, portId]);
  }

}