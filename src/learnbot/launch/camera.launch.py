import os

from launch import LaunchDescription
from launch_ros.actions import Node

# Uses v4l2_camera against the legacy bcm2835-v4l2/mmal stack, not camera_ros/
# libcamera -- on this Pi 4 + Camera Module v2 (IMX219) setup, libcamera
# detection did not work, while enabling Legacy Camera via raspi-config
# (Interface Options -> Legacy Camera) turns /dev/video0 into a proper mmal
# device that v4l2_camera reads directly. Requires `ros-humble-v4l2-camera`
# and Legacy Camera enabled + a reboot on the Pi (confirm with
# `vcgencmd get_camera` -> detected=1).

def generate_launch_description():

    return LaunchDescription([

        Node(
            package='v4l2_camera',
            executable='v4l2_camera_node',
            output='screen',
            namespace='camera',
            parameters=[{
                'video_device': '/dev/video0',
                'image_size': [640, 480],
                'camera_frame_id': 'camera_link_optical'
                }]
    )
    ])
