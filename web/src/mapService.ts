import ROSLIB from 'roslib';
import { rosConnection } from './rosConnection';
import type { RobotViewer } from './robotViewer';

interface GetMapResponse {
  map: {
    info: { resolution: number; width: number; height: number; origin: { position: { x: number; y: number; z: number } } };
    data: number[];
  };
}

// map_server publishes /map exactly once with transient-local (latched)
// durability -- roslib.js's Topic has no way to request that QoS, so a
// subscription started any time after map_server's one-shot publish (which,
// realistically, is almost always -- nav2 is normally already running by
// the time this dashboard connects) would simply never receive it. Calling
// the /map_server/map service instead sidesteps durability entirely: it's a
// fresh request/response, not a subscription waiting on a past publish.
const RETRY_DELAY_MS = 3000;

// nav2 isn't necessarily running yet when this dashboard loads -- it's a
// separate launch step, and it's entirely normal to start the dashboard
// first. The service just won't exist until nav2's map_server comes up, so
// keep retrying rather than failing once and leaving the map panel
// permanently blank; it's a cheap call with nothing else waiting on it.
export function fetchMap(viewer: RobotViewer): void {
  const getMap = new ROSLIB.Service({
    ros: rosConnection.ros,
    name: '/map_server/map',
    serviceType: 'nav_msgs/srv/GetMap',
  });

  const attempt = () => {
    getMap.callService(
      new ROSLIB.ServiceRequest({}),
      (response) => {
        const { info, data } = (response as unknown as GetMapResponse).map;
        viewer.setMap({
          width: info.width,
          height: info.height,
          resolution: info.resolution,
          originX: info.origin.position.x,
          originY: info.origin.position.y,
          originZ: info.origin.position.z,
          data,
        });
      },
      () => setTimeout(attempt, RETRY_DELAY_MS),
    );
  };

  attempt();
}
