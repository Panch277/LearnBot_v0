import ROSLIB from 'roslib';
import { rosConnection } from './rosConnection';
import type { RobotViewer } from './robotViewer';

interface JointStateMsg {
  name: string[];
  position: number[];
}

interface OdometryMsg {
  pose: {
    pose: {
      position: { x: number; y: number; z: number };
      orientation: { x: number; y: number; z: number; w: number };
    };
  };
}

export function subscribeRobotState(viewer: RobotViewer): void {
  const jointStates = new ROSLIB.Topic({
    ros: rosConnection.ros,
    name: '/joint_states',
    messageType: 'sensor_msgs/msg/JointState',
  });

  jointStates.subscribe((message) => {
    const { name, position } = message as unknown as JointStateMsg;
    for (let i = 0; i < name.length; i++) {
      viewer.setJointValue(name[i], position[i]);
    }
  });

  // /diff_cont/odom carries base_link's pose relative to odom directly,
  // which is simpler than building a client-side TF tree just to place the
  // robot's root -- good enough for this view since we only need the
  // robot's own pose, not an arbitrary frame's.
  const odom = new ROSLIB.Topic({
    ros: rosConnection.ros,
    name: '/diff_cont/odom',
    messageType: 'nav_msgs/msg/Odometry',
  });

  odom.subscribe((message) => {
    const { position, orientation } = (message as unknown as OdometryMsg).pose.pose;
    viewer.setBasePose(position, orientation);
  });
}
