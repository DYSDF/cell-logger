import Env from "cell-env";
import { anything2Level } from "./level-helper";

export type LoggerConfig = {
  "log_level": number;
  "log_paths": Array<string>;
  "log_flags": Array<string>;
  "log_store": boolean,
  "log_pubkey"?: string,
  "log_prikey"?: string
};

const env = Env({
  "log_level": {
    def: 0, // Error级别
    fit: anything2Level
  },

  "log_paths": {
    def: ["**"],
    fit: Env.helper.fit.strings
  },

  "log_flags": {
    def: ["color", "level", "path"], // 'color', 'level', 'path', 'time'
    fit: Env.helper.fit.strings
  },

  "log_store": {
    def: true,
    fit: Env.helper.fit.bool
  },

  "log_prikey": {
    def: ""
  }
}, '__logger__');

export default Object.assign({
  log_pubkey: ""
}, env)
