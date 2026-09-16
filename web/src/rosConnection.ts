import ROSLIB from 'roslib';

export type ConnectionState = 'connecting' | 'connected' | 'error' | 'closed';

type Listener = (state: ConnectionState) => void;

const ROSBRIDGE_URL = `ws://${location.hostname}:9090`;

class RosConnection {
  readonly ros: ROSLIB.Ros;
  private state: ConnectionState = 'connecting';
  private listeners: Listener[] = [];

  constructor() {
    this.ros = new ROSLIB.Ros({ url: ROSBRIDGE_URL });

    this.ros.on('connection', () => this.setState('connected'));
    this.ros.on('error', () => this.setState('error'));
    this.ros.on('close', () => this.setState('closed'));
  }

  onStateChange(listener: Listener): void {
    this.listeners.push(listener);
    listener(this.state);
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }
}

export const rosConnection = new RosConnection();
