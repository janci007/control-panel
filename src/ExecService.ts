import { Service, SwitchEvent, ItemStatusListener } from ".";
import { exec, spawn } from "child_process";

export default class ExecService implements Service {

  private items = [];

  addStatusListener(type: string, item, listener: ItemStatusListener) {
    let updateStatus = (cb) => {
      if (!item.status) return;
      let process = exec(item.status);
      process.on("close", (code) => {
        if (code === 0) {
          listener("up");
        } else {
          listener("down");
        }
        if (cb) cb();
      })
    };
    this.items.push({ item, listener, updateStatus });
    if (item.interval) {
      let updateStatusAndSetTimeout = () => updateStatus(() => setTimeout(updateStatusAndSetTimeout, item.interval * 1000));
      updateStatusAndSetTimeout();
    }
  }

  handleEvent(type: string, item, event: SwitchEvent) {
    let i = this.items.find(i => i.item === item);
    if (event === "up" || event === "down") {
      console.log("exec", item[event]);
      let child = spawn(item[event], [], {
        stdio: "ignore",
        detached: true,
        shell: true,
      });
      child.on("close", () => {
        i.updateStatus()
      });
      child.unref();
    }
  }

}