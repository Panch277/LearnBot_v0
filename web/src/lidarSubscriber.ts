import ROSLIB from 'roslib';
import { rosConnection } from './rosConnection';
import type { RobotViewer } from './robotViewer';

interface LaserScanMsg {
  ranges: number[];
  angle_min: number;
  angle_increment: number;
  range_min: number;
  range_max: number;
}

export function subscribeLidar(viewer: RobotViewer): void {
  const scan = new ROSLIB.Topic({
    ros: rosConnection.ros,
    name: '/scan',
    messageType: 'sensor_msgs/msg/LaserScan',
  });

  scan.subscribe((message) => {
    const msg = message as unknown as LaserScanMsg;
    viewer.setLidarScan({
      ranges: msg.ranges,
      angleMin: msg.angle_min,
      angleIncrement: msg.angle_increment,
      rangeMin: msg.range_min,
      rangeMax: msg.range_max,
    });
  });
}
