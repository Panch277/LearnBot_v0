import { rosConnection, type ConnectionState } from './rosConnection';
import { initTeleop } from './teleop';
import { RobotViewer } from './robotViewer';
import { subscribeRobotState } from './jointStateSubscriber';
import { subscribeLidar } from './lidarSubscriber';
import { fetchMap } from './mapService';
import { subscribeMapFrame } from './mapFrameSubscriber';
import { publishInitialPose, publishGoalPose } from './navControls';

// web_video_server wants the *base* raw image topic (sensor_msgs/msg/Image) --
// it does its own re-encoding to MJPEG internally. Pointing it at the
// already-compressed /camera/image_raw/compressed topic causes a silent
// type mismatch (CompressedImage vs Image) and zero frames delivered.
const CAMERA_STREAM_URL =
  `http://${location.hostname}:8080/stream?topic=/camera/image_raw&type=mjpeg&quality=50`;

function initConnectionBadge(): void {
  const badge = document.getElementById('connection-badge');
  if (!badge) return;

  const labels: Record<ConnectionState, string> = {
    connecting: 'connecting…',
    connected: 'connected',
    error: 'error',
    closed: 'disconnected',
  };

  rosConnection.onStateChange((state) => {
    badge.textContent = labels[state];
    badge.className = `badge badge--${state}`;
  });
}

function initCameraFeed(): void {
  const img = document.getElementById('camera-feed') as HTMLImageElement | null;
  if (!img) return;

  const connect = () => {
    img.src = `${CAMERA_STREAM_URL}&_=${Date.now()}`;
  };

  img.addEventListener('error', () => {
    setTimeout(connect, 2000);
  });

  connect();
}

function initRobotViewer(): void {
  const container = document.getElementById('robot-viewer');
  if (!container) return;

  const viewer = new RobotViewer(container);
  viewer
    .load()
    .then(() => {
      subscribeRobotState(viewer);
      subscribeLidar(viewer);
      subscribeMapFrame(viewer);
      fetchMap(viewer);
    })
    .catch((err) => console.error('Failed to load robot URDF', err));

  type ViewMode = 'orbit' | 'pan' | 'pose' | 'goal';
  let mode: ViewMode = 'orbit';

  const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-view-mode]');
  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      mode = button.dataset.viewMode as ViewMode;
      viewer.setInteractionMode(mode);
      for (const other of modeButtons) other.classList.toggle('is-active', other === button);
    });
  }

  viewer.domElement.addEventListener('click', (event) => {
    if (mode !== 'pose' && mode !== 'goal') return;
    const point = viewer.pickMapPoint(event.clientX, event.clientY);
    if (!point) return;
    if (mode === 'pose') publishInitialPose(point.x, point.y);
    else publishGoalPose(point.x, point.y);
  });
}

initConnectionBadge();
initCameraFeed();
initTeleop();
initRobotViewer();
