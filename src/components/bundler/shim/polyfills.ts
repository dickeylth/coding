import process from "process";
import { Buffer } from "buffer";
import EventEmitter from "events";

window.Buffer = Buffer;
window.process = process;
// @ts-ignore
window.EventEmitter = EventEmitter;

export {
  process,
  Buffer,
  EventEmitter,
}
