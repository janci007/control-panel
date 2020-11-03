import * as sms from 'source-map-support';
import { addTimestamp } from "./util/logging";
import PuleaudioService from "./PulseaudioService"
import * as mqtt from "async-mqtt";
import * as config from "../config";
import NetworkManagerService from "./NetworkManagerService";
import ExecService from './ExecService';

sms.install();

console.log = addTimestamp(console.log);
console.error = addTimestamp(console.error);
console.warn = addTimestamp(console.warn);

export type SwitchEvent = "up" | "down";
export type ItemStatus = "up" | "down" | "warning";
export type ItemStatusListener = (status: ItemStatus) => void
export interface Service {
    addStatusListener(type: string, item: any, listener: ItemStatusListener);
    handleEvent(type: string, item: any, event: SwitchEvent);
}

const colorMap: { [status in ItemStatus]: string } = {
    "up": "001000",
    "down": "100000",
    "warning": "100500"
}


const services: { [name: string]: Service } = {
    "pulseaudio": new PuleaudioService(),
    "networkmanager": new NetworkManagerService(),
    "exec": new ExecService()
}

const switchStates: { [switchId: number]: boolean } = {};


void (async function () {
    const client = mqtt.connect(config.mqtt.broker, {

    });
    client.on("message", onMessage);
    await client.subscribe("control-panel/switch/+/status");
    await client.subscribe("control-panel/switch/+/event");


    for (let sw of config.switches) {
        services[sw.service].addStatusListener(sw.type, sw.item, (status) => {
            if ((status === "up" && switchStates[sw.id] === false) || (status === "down" && switchStates[sw.id] === true)) {
                void client.publish("control-panel/led/" + sw.id + "/color", colorMap.warning, { retain: true });
            } else {
                void client.publish("control-panel/led/" + sw.id + "/color", colorMap[status], { retain: true });
            }
        })
    }

})();

function onMessage(topic: string, message: Buffer, packet) {
    let parts = topic.split("/");
    if (parts[1] === "switch") {
        let switchId = +parts[2];
        if (parts[3] === "event") {
            onSwitchEvent(switchId, message.toString("utf-8") as SwitchEvent);
        } else if (parts[3] === "status") {
            switchStates[switchId] = message.toString("utf-8") === "1";
        }
    }
}

function onSwitchEvent(id: number, event: SwitchEvent) {
    for (let sw of config.switches) {
        if (sw.id === id) {
            services[sw.service].handleEvent(sw.type, sw.item, event);
        }
    }
}

process.on("SIGINT", () => {
    process.exit(0);
})
