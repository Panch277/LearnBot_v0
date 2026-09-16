import ROSLIB from 'roslib';
import { rosConnection } from './rosConnection';
import type { RobotViewer } from './robotViewer';

interface TFMessage {
  transforms: Array<{
    header: { frame_id: string };
    child_frame_id: string;
    transform: {
      translation: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
    };
  }>;
}

// AMCL publishes the map->odom correction on /tf as it localizes. Everything
// else in the 3D view is already positioned relative to odom (via
// /diff_cont/odom), so the map plane just needs this one transform to stay
// aligned with the robot -- no need for a general client-side TF tree.
export function subscribeMapFrame(viewer: RobotViewer): void {
  const tf = new ROSLIB.Topic({
    ros: rosConnection.ros,
    name: '/tf',
    messageType: 'tf2_msgs/msg/TFMessage',
  });

  tf.subscribe((message) => {
    for (const t of (message as unknown as TFMessage).transforms) {
      if (t.header.frame_id === 'map' && t.child_frame_id === 'odom') {
        viewer.setMapOdomTransform(t.transform.translation, t.transform.rotation);
      }
    }
  });
}
