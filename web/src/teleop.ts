import ROSLIB from 'roslib';
import { rosConnection } from './rosConnection';

const LINEAR_SPEED = 0.15; // m/s
const ANGULAR_SPEED = 0.5; // rad/s
const PUBLISH_RATE_MS = 100;

const cmdVelTopic = new ROSLIB.Topic({
  ros: rosConnection.ros,
  name: '/cmd_vel_joy',
  messageType: 'geometry_msgs/msg/Twist',
});

type Direction = 'forward' | 'backward' | 'left' | 'right';

const activeDirections = new Set<Direction>();
let publishInterval: ReturnType<typeof setInterval> | undefined;

function currentTwist(): ROSLIB.Message {
  let linear = 0;
  let angular = 0;
  if (activeDirections.has('forward')) linear += LINEAR_SPEED;
  if (activeDirections.has('backward')) linear -= LINEAR_SPEED;
  if (activeDirections.has('left')) angular += ANGULAR_SPEED;
  if (activeDirections.has('right')) angular -= ANGULAR_SPEED;

  return new ROSLIB.Message({
    linear: { x: linear, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: angular },
  });
}

function publishCurrentTwist(): void {
  cmdVelTopic.publish(currentTwist());
}

function startDirection(direction: Direction): void {
  activeDirections.add(direction);
  if (!publishInterval) {
    publishInterval = setInterval(publishCurrentTwist, PUBLISH_RATE_MS);
  }
  publishCurrentTwist();
}

function stopDirection(direction: Direction): void {
  activeDirections.delete(direction);
  publishCurrentTwist();
  if (activeDirections.size === 0 && publishInterval) {
    clearInterval(publishInterval);
    publishInterval = undefined;
    // Publish one final stop command so the robot doesn't coast on the last command.
    cmdVelTopic.publish(
      new ROSLIB.Message({
        linear: { x: 0, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: 0 },
      })
    );
  }
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'forward',
  KeyW: 'forward',
  ArrowDown: 'backward',
  KeyS: 'backward',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

export function initTeleop(): void {
  window.addEventListener('keydown', (event) => {
    const direction = KEY_TO_DIRECTION[event.code];
    if (direction && !event.repeat) startDirection(direction);
  });

  window.addEventListener('keyup', (event) => {
    const direction = KEY_TO_DIRECTION[event.code];
    if (direction) stopDirection(direction);
  });

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-teleop-direction]')) {
    const direction = button.dataset.teleopDirection as Direction;

    const start = (event: Event) => {
      event.preventDefault();
      startDirection(direction);
    };
    const stop = (event: Event) => {
      event.preventDefault();
      stopDirection(direction);
    };

    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointerleave', stop);
    button.addEventListener('pointercancel', stop);
  }
}
